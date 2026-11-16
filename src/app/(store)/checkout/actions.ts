'use server'

import { Polar } from '@polar-sh/sdk'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '@/lib/firebase/admin'
import { verifyIdToken } from '@/lib/auth/server'
import { ProductType } from '@/types'

const MAX_QTY_PER_LINE = 10

interface CheckoutAddress {
	street: string
	city: string
	state: string
	district?: string
	zip_code: string
	phone: string
}

interface CheckoutOptions {
	/** Firebase ID token from the signed-in client. Required. */
	idToken?: string
	userEmail?: string
	shippingCharge?: number // display only — the server recalculates it
	address?: CheckoutAddress
	paymentMethod?: string
	idempotencyKey?: string
}

type CartLine = {
	cartItemId: string
	productId: string
	quantity: number
	selectedColor?: string
	selectedSize?: string
	productTitle: string
	unitPrice: number
}

type ProductVariant = {
	color: string
	images?: string[]
	sizes?: Array<{ size: string; stock: number }>
}

class CheckoutError extends Error {
	code: string
	constructor(code: string, message: string) {
		super(message)
		this.code = code
	}
}

let polarClient: Polar | null = null
function getPolar(): Polar {
	if (!polarClient) {
		const accessToken = process.env.POLAR_ACCESS_TOKEN
		if (!accessToken) {
			throw new CheckoutError(
				'PAYMENT_NOT_CONFIGURED',
				'Online payment is not configured yet. Please choose Cash on Delivery.',
			)
		}
		polarClient = new Polar({ accessToken, server: 'sandbox' })
	}
	return polarClient
}

function currentUnitPrice(product: ProductType): number {
	const isOnSale =
		!!product.discount_price &&
		product.discount_price > 0 &&
		product.discount_price <= 100
	return isOnSale
		? product.price - product.price * ((product.discount_price as number) / 100)
		: product.price
}

function itemKey(productId: string, color?: string, size?: string) {
	return `${productId}::${color ?? ''}::${size ?? ''}`
}

function decrementVariants(
	product: ProductType,
	color: string | undefined,
	size: string | undefined,
	qty: number,
): ProductVariant[] | null {
	if (!Array.isArray(product.variants) || product.variants.length === 0) {
		return null
	}
	if (!color && !size) return null

	const variants = JSON.parse(JSON.stringify(product.variants)) as ProductVariant[]

	const colour = color
		? variants.find((v) => v.color?.toLowerCase() === color.toLowerCase())
		: variants.length === 1
			? variants[0]
			: undefined

	if (!colour || !Array.isArray(colour.sizes)) {
		throw new CheckoutError(
			'VARIANT_UNAVAILABLE',
			`The selected option for “${product.title}” is no longer available.`,
		)
	}

	const sizeRow = size
		? colour.sizes.find((s) => s.size?.toLowerCase() === size.toLowerCase())
		: colour.sizes.length === 1
			? colour.sizes[0]
			: undefined

	if (!sizeRow) {
		throw new CheckoutError(
			'VARIANT_UNAVAILABLE',
			`The selected size for “${product.title}” is no longer available.`,
		)
	}
	if (sizeRow.stock < qty) {
		throw new CheckoutError(
			'STOCK_UNAVAILABLE',
			`Only ${Math.max(0, sizeRow.stock)} left of “${product.title}” (${sizeRow.size}).`,
		)
	}

	sizeRow.stock -= qty
	return variants
}

function requiredAddress(address?: CheckoutAddress): CheckoutAddress {
	if (
		!address ||
		!address.street?.trim() ||
		!address.city?.trim() ||
		!address.state?.trim() ||
		!address.zip_code?.trim() ||
		!address.phone?.trim()
	) {
		throw new CheckoutError(
			'INVALID_ADDRESS',
			'Please fill in street, city, state, PIN code and phone number.',
		)
	}
	if (!/^[0-9]{4,10}$/.test(address.zip_code.trim())) {
		throw new CheckoutError('INVALID_ADDRESS', 'Please enter a valid PIN code.')
	}
	if (!/^[0-9+\-\s]{7,16}$/.test(address.phone.trim())) {
		throw new CheckoutError(
			'INVALID_ADDRESS',
			'Please enter a valid phone number.',
		)
	}
	return address
}

/**
 * Shipping is always calculated on the server from the admin-managed
 * `shipping_rates` collection. A client-supplied charge is ignored.
 */
async function calculateShipping(
	state: string,
	district?: string,
	city?: string,
): Promise<number> {
	try {
		const snapshot = await db.collection('shipping_rates').get()
		const rates = snapshot.docs.map((doc) => doc.data() as {
			state?: string
			district?: string
			charge?: number
		})

		const wantedState = state.trim().toLowerCase()
		const wantedDistrict = (district || city || '').trim().toLowerCase()

		const exact = rates.find(
			(r) =>
				r.state?.trim().toLowerCase() === wantedState &&
				r.district?.trim().toLowerCase() === wantedDistrict,
		)
		if (exact && typeof exact.charge === 'number') return exact.charge

		const stateWide = rates.find(
			(r) =>
				r.state?.trim().toLowerCase() === wantedState &&
				(!r.district || r.district.trim() === ''),
		)
		if (stateWide && typeof stateWide.charge === 'number') return stateWide.charge

		return 0
	} catch (error) {
		console.error('Failed to calculate shipping:', error)
		return 0
	}
}

async function loadCartLines(userId: string) {
	const cartSnapshot = await db
		.collection('carts')
		.where('user_id', '==', userId)
		.where('status', '==', 'active')
		.limit(1)
		.get()

	if (cartSnapshot.empty) {
		throw new CheckoutError('CART_EMPTY', 'Your cart is empty.')
	}

	const cartDoc = cartSnapshot.docs[0]
	const itemSnapshot = await db
		.collection('cart_items')
		.where('cart_id', '==', cartDoc.id)
		.get()

	if (itemSnapshot.empty) {
		throw new CheckoutError('CART_EMPTY', 'Your cart is empty.')
	}

	const productIds = Array.from(
		new Set(itemSnapshot.docs.map((doc) => String(doc.data().product_id))),
	)
	const productDocs = await Promise.all(
		productIds.map((id) => db.collection('products').doc(id).get()),
	)
	const products = new Map<string, ProductType & { product_id: string }>()
	productDocs.forEach((doc) => {
		if (doc.exists) {
			products.set(doc.id, {
				...(doc.data() as ProductType),
				product_id: doc.id,
			})
		}
	})

	const lines: CartLine[] = []
	for (const itemDoc of itemSnapshot.docs) {
		const item = itemDoc.data()
		const product = products.get(String(item.product_id))
		if (!product) continue

		const quantity = Number(item.quantity)
		if (!Number.isInteger(quantity) || quantity <= 0) continue
		if (quantity > MAX_QTY_PER_LINE) {
			throw new CheckoutError(
				'INVALID_QUANTITY',
				`Maximum ${MAX_QTY_PER_LINE} units per item are allowed.`,
			)
		}

		lines.push({
			cartItemId: itemDoc.id,
			productId: product.product_id,
			quantity,
			selectedColor: item.selectedColor || undefined,
			selectedSize: item.selectedSize || undefined,
			productTitle: product.title,
			unitPrice: currentUnitPrice(product),
		})
	}

	if (lines.length === 0) {
		throw new CheckoutError(
			'CART_EMPTY',
			'Some items in your cart are no longer available.',
		)
	}

	return { cartId: cartDoc.id, cartItemIds: itemSnapshot.docs.map((d) => d.id), lines }
}

function buildOrderItems(
	orderId: string,
	lines: CartLine[],
): Array<Record<string, unknown>> {
	return lines.map((line) => ({
		order_id: orderId,
		product_id: line.productId,
		quantity: line.quantity,
		price: line.unitPrice,
		product_title: line.productTitle,
		selectedColor: line.selectedColor ?? null,
		selectedSize: line.selectedSize ?? null,
	}))
}

/** Cash-on-delivery / manual-payment path: atomic stock + order + cart clear. */
async function placeCodOrder(params: {
	userId: string
	address: CheckoutAddress
	lines: CartLine[]
	cartId: string
	cartItemIds: string[]
	subtotal: number
	shipping: number
	paymentMethod: string
	idempotencyKey: string
}): Promise<{ orderId: string; total: number }> {
	const {
		userId,
		address,
		lines,
		cartId,
		cartItemIds,
		subtotal,
		shipping,
		paymentMethod,
		idempotencyKey,
	} = params

	return db.runTransaction(async (transaction) => {
		// Idempotency: return the existing order for a duplicate submit/retry.
		const existing = await transaction.get(
			db
				.collection('orders')
				.where('idempotency_key', '==', idempotencyKey)
				.limit(1),
		)
		if (!existing.empty) {
			const existingOrder = existing.docs[0]
			return {
				orderId: existingOrder.id,
				total: Number(existingOrder.data().total) || 0,
			}
		}

		// Re-read all products inside the transaction so stock checks are atomic.
		const uniqueProductIds = Array.from(
			new Set(lines.map((line) => line.productId)),
		)
		const productRefs = uniqueProductIds.map((id) =>
			db.collection('products').doc(id),
		)
		const productDocs = await Promise.all(
			productRefs.map((ref) => transaction.get(ref)),
		)

		const freshProducts = new Map<
			string,
			ProductType & { product_id: string }
		>()
		productDocs.forEach((doc) => {
			if (doc.exists) {
				freshProducts.set(doc.id, {
					...(doc.data() as ProductType),
					product_id: doc.id,
				})
			}
		})

		// Validate + compute variant updates and per-product totals.
		const qtyByProduct = new Map<string, number>()
		const variantUpdates = new Map<string, ProductVariant[] | null>()

		for (const line of lines) {
			const product = freshProducts.get(line.productId)
			if (!product) {
				throw new CheckoutError(
					'PRODUCT_UNAVAILABLE',
					`“${line.productTitle}” is no longer available.`,
				)
			}
			const already = qtyByProduct.get(line.productId) ?? 0
			const newQty = already + line.quantity
			const stock = Number(product.stock) || 0
			if (newQty > stock) {
				throw new CheckoutError(
					'STOCK_UNAVAILABLE',
					`Only ${Math.max(0, stock - already)} left of “${product.title}”.`,
				)
			}
			qtyByProduct.set(line.productId, newQty)

			const updatedVariants = decrementVariants(
				product,
				line.selectedColor,
				line.selectedSize,
				line.quantity,
			)
			if (updatedVariants) {
				variantUpdates.set(
					itemKey(line.productId, line.selectedColor, line.selectedSize),
					updatedVariants,
				)
			}
		}

		const total = Math.round((subtotal + shipping) * 100) / 100
		const addressRef = db.collection('addresses').doc()
		const orderRef = db.collection('orders').doc()

		// --- Writes start here ---
		transaction.set(addressRef, {
			user_id: userId,
			street: address.street.trim(),
			city: address.city.trim(),
			state: address.state.trim(),
			district: address.district?.trim() || null,
			zip_code: address.zip_code.trim(),
			country: 'IN',
			phone: address.phone.trim(),
			is_default: false,
			created_at: FieldValue.serverTimestamp(),
		})

		transaction.set(orderRef, {
			user_id: userId,
			status: 'processing',
			payment_status: 'cod_pending',
			payment_method: paymentMethod,
			payment_id: `cod_${orderRef.id}`,
			subtotal,
			shipping,
			total,
			shipping_address_id: addressRef.id,
			shipping_address: {
				street: address.street.trim(),
				city: address.city.trim(),
				state: address.state.trim(),
				district: address.district?.trim() || '',
				zip_code: address.zip_code.trim(),
				country: 'IN',
				phone: address.phone.trim(),
			},
			idempotency_key: idempotencyKey,
			created_at: FieldValue.serverTimestamp(),
			updated_at: FieldValue.serverTimestamp(),
		})

		for (const orderItem of buildOrderItems(orderRef.id, lines)) {
			const itemRef = db.collection('order_items').doc()
			transaction.set(itemRef, {
				...orderItem,
				created_at: FieldValue.serverTimestamp(),
			})
		}

		transaction.set(db.collection('order_status_history').doc(), {
			order_id: orderRef.id,
			from_status: null,
			to_status: 'processing',
			actor_id: userId,
			actor_role: 'customer',
			note: 'Order placed (COD/manual payment)',
			created_at: FieldValue.serverTimestamp(),
		})

		for (const [productId, qty] of qtyByProduct) {
			const product = freshProducts.get(productId)!
			const update: Record<string, unknown> = {
				stock: (Number(product.stock) || 0) - qty,
				updated_at: FieldValue.serverTimestamp(),
			}
			for (const [key, variants] of variantUpdates) {
				if (key.startsWith(`${productId}::`)) update.variants = variants
			}
			transaction.update(db.collection('products').doc(productId), update)
		}

		for (const cartItemId of cartItemIds) {
			transaction.delete(db.collection('cart_items').doc(cartItemId))
		}
		transaction.update(db.collection('carts').doc(cartId), {
			status: 'converted',
			updated_at: FieldValue.serverTimestamp(),
		})

		return { orderId: orderRef.id, total }
	})
}

/** Online path: create a pending order, then hand off to Polar. */
async function placeOnlineOrder(params: {
	userId: string
	userEmail?: string
	address: CheckoutAddress
	lines: CartLine[]
	subtotal: number
	shipping: number
	paymentMethod: string
	idempotencyKey: string
	cartId: string
}): Promise<{ checkoutUrl: string; orderId: string }> {
	const {
		userId,
		userEmail,
		address,
		lines,
		subtotal,
		shipping,
		paymentMethod,
		idempotencyKey,
		cartId,
	} = params

	const existing = await db
		.collection('orders')
		.where('idempotency_key', '==', idempotencyKey)
		.limit(1)
		.get()

	if (!existing.empty) {
		const existingOrder = existing.docs[0].data()
		if (existingOrder.checkout_url) {
			return {
				orderId: existing.docs[0].id,
				checkoutUrl: String(existingOrder.checkout_url),
			}
		}
		throw new CheckoutError(
			'CHECKOUT_IN_PROGRESS',
			'A checkout for this cart is already in progress. Please wait a moment.',
		)
	}

	const polar = getPolar()
	const total = Math.round((subtotal + shipping) * 100) / 100
	const totalAmountInCents = Math.round(total * 100)

	const polarProductId = await getPolarProduct(polar)
	const baseUrl =
		process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
	const currency = (process.env.POLAR_CURRENCY || 'usd') as 'usd'

	const addressRef = db.collection('addresses').doc()
	const orderRef = db.collection('orders').doc()

	await addressRef.set({
		user_id: userId,
		street: address.street.trim(),
		city: address.city.trim(),
		state: address.state.trim(),
		district: address.district?.trim() || null,
		zip_code: address.zip_code.trim(),
		country: 'IN',
		phone: address.phone.trim(),
		is_default: false,
		created_at: FieldValue.serverTimestamp(),
	})

	await orderRef.set({
		user_id: userId,
		status: 'pending_payment',
		payment_status: 'pending',
		payment_method: paymentMethod,
		subtotal,
		shipping,
		total,
		shipping_address_id: addressRef.id,
		shipping_address: {
			street: address.street.trim(),
			city: address.city.trim(),
			state: address.state.trim(),
			district: address.district?.trim() || '',
			zip_code: address.zip_code.trim(),
			country: 'IN',
			phone: address.phone.trim(),
		},
		idempotency_key: idempotencyKey,
		cart_id: cartId,
		expires_at: new Date(Date.now() + 30 * 60 * 1000),
		created_at: FieldValue.serverTimestamp(),
		updated_at: FieldValue.serverTimestamp(),
	})

	for (const orderItem of buildOrderItems(orderRef.id, lines)) {
		await db.collection('order_items').add({
			...orderItem,
			created_at: FieldValue.serverTimestamp(),
		})
	}

	const prices: Record<
		string,
		Array<{
			amountType: 'fixed'
			priceAmount: number
			priceCurrency: string
			metadata?: Record<string, string>
		}>
	> = {}
	prices[polarProductId] = [
		{
			amountType: 'fixed',
			priceAmount: totalAmountInCents,
			priceCurrency: currency,
			metadata: {
				order_id: orderRef.id,
				cart_items: JSON.stringify(
					lines.map((line) => ({
						product_id: line.productId,
						quantity: line.quantity,
						price: line.unitPrice,
						product_title: line.productTitle,
						selectedColor: line.selectedColor,
						selectedSize: line.selectedSize,
					})),
				),
				total_items: String(lines.length),
				shipping_charge: String(shipping),
				payment_method: paymentMethod,
			},
		},
	]

	const checkout = await polar.checkouts.create({
		products: [polarProductId],
		prices: prices as Parameters<typeof polar.checkouts.create>[0]['prices'],
		externalCustomerId: userId,
		successUrl: `${baseUrl}/checkout/success?order_id=${orderRef.id}&checkout_id={CHECKOUT_ID}`,
		customerEmail: userEmail || undefined,
		metadata: {
			order_id: orderRef.id,
			user_id: userId,
			shipping_charge: String(shipping),
			cart_id: cartId,
		},
	})

	if (!checkout.url) {
		throw new CheckoutError(
			'PAYMENT_ERROR',
			'Could not start the payment session. Please try again.',
		)
	}

	await orderRef.update({
		payment_id: checkout.id,
		polar_checkout_id: checkout.id,
		checkout_url: checkout.url,
		updated_at: FieldValue.serverTimestamp(),
	})

	return { orderId: orderRef.id, checkoutUrl: checkout.url }
}

async function getPolarProduct(polar: Polar): Promise<string> {
	const productId = process.env.POLAR_PRODUCT_ID
	if (productId) return productId

	const organizationId =
		process.env.POLAR_ORGANIZATION_ID || process.env.POLAR_ORG_ID
	const listParams = organizationId ? { organizationId } : {}

	try {
		const productsIterator = await polar.products.list(listParams)
		for await (const page of productsIterator) {
			const items = page?.result?.items
			if (items) {
				const product = items.find(
					(p: { isArchived?: boolean; id?: string }) => !p.isArchived,
				)
				if (product?.id) return product.id
			}
		}
		throw new CheckoutError(
			'PAYMENT_NOT_CONFIGURED',
			'No active payment product is configured.',
		)
	} catch (error) {
		if (error instanceof CheckoutError) throw error
		console.error('Error getting Polar product:', error)
		throw new CheckoutError(
			'PAYMENT_ERROR',
			'Could not prepare the payment session.',
		)
	}
}

export async function createPolarCheckout(options?: CheckoutOptions) {
	try {
		// Never trust a user id from the client. Verify the Firebase ID token.
		const caller = await verifyIdToken(options?.idToken)
		if (!caller) {
			throw new CheckoutError(
				'UNAUTHORIZED',
				'Your session expired. Please sign in again.',
			)
		}

		const address = requiredAddress(options?.address)
		const paymentMethod = options?.paymentMethod || 'Polar / Credit Card'
		const idempotencyKey = options?.idempotencyKey || `auto_${caller.uid}_${Date.now()}`

		const { cartId, cartItemIds, lines } = await loadCartLines(caller.uid)
		const subtotal =
			Math.round(
				lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100,
			) / 100
		const shipping = await calculateShipping(
			address.state,
			address.district,
			address.city,
		)

		const isCod =
			paymentMethod === 'Cash on Delivery' || paymentMethod === 'Bank Transfer'

		if (isCod) {
			const order = await placeCodOrder({
				userId: caller.uid,
				address,
				lines,
				cartId,
				cartItemIds,
				subtotal,
				shipping,
				paymentMethod,
				idempotencyKey,
			})
			const baseUrl =
				process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
			return {
				success: true as const,
				orderId: order.orderId,
				checkoutUrl: `${baseUrl}/checkout/success?order_id=${order.orderId}`,
				checkoutId: order.orderId,
			}
		}

		const online = await placeOnlineOrder({
			userId: caller.uid,
			userEmail: options?.userEmail || caller.email,
			address,
			lines,
			subtotal,
			shipping,
			paymentMethod,
			idempotencyKey,
			cartId,
		})

		return {
			success: true as const,
			orderId: online.orderId,
			checkoutUrl: online.checkoutUrl,
			checkoutId: online.orderId,
		}
	} catch (error) {
		if (error instanceof CheckoutError) {
			return { success: false as const, error: error.message, code: error.code }
		}
		console.error('Error creating checkout:', error)
		return {
			success: false as const,
			error: 'Something went wrong while placing your order. Please try again.',
			code: 'INTERNAL_ERROR',
		}
	}
}

export async function getShippingRatesAction() {
	try {
		const snapshot = await db.collection('shipping_rates').get()
		if (snapshot.empty) return []

		return snapshot.docs.map((doc) => ({
			id: doc.id,
			...(doc.data() as { state: string; district?: string; charge: number }),
		}))
	} catch (error) {
		console.error('Error fetching shipping rates from server:', error)
		return []
	}
}
