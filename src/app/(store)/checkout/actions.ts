'use server'

import { Polar } from '@polar-sh/sdk'
import { db } from '@/lib/firebase/admin'
import { ProductType } from '@/types'

const polar = new Polar({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	server: 'sandbox',
})

/**
 * Get an existing Polar product for e-commerce checkouts
 * Uses POLAR_PRODUCT_ID if set, otherwise finds the first non-archived product
 */
async function getPolarProduct(): Promise<string> {
	const productId = process.env.POLAR_PRODUCT_ID
	if (productId) return productId

	const organizationId = process.env.POLAR_ORG_ID
	const listParams = organizationId ? { organizationId } : {}

	try {
		const productsIterator = await polar.products.list(listParams)
		for await (const page of productsIterator) {
			if (page?.result?.items) {
				const product = page.result.items.find(
					(p: { isArchived?: boolean; id?: string }) => !p.isArchived
				)
				if (product?.id) return product.id
			}
		}
		throw new Error('No active Polar products found.')
	} catch (error) {
		console.error('Error getting Polar product:', error)
		throw new Error(`Failed to get Polar product: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export async function createPolarCheckout(options?: {
	userId?: string;
	userEmail?: string;
	shippingCharge?: number;
	address?: {
		street: string;
		city: string;
		state: string;
		district?: string;
		zip_code: string;
		phone: string;
	};
	paymentMethod?: string;
}) {
	try {
		// Supabase is completely bypassed - using passed userId from Firebase Client Auth
		const userId = options?.userId
		if (!userId) throw new Error('Unauthorized')

		const cartSnapshot = await db.collection('carts')
			.where('user_id', '==', userId)
			.where('status', '==', 'active')
			.limit(1)
			.get()

		if (cartSnapshot.empty) {
			throw new Error('No active cart found')
		}
		const cartDoc = cartSnapshot.docs[0]
		const cart = { id: cartDoc.id, ...cartDoc.data() }

		const itemsSnapshot = await db.collection('cart_items')
			.where('cart_id', '==', cart.id)
			.get()

		if (itemsSnapshot.empty) {
			throw new Error('Cart is empty')
		}

		const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
		let totalAmount = 0
		const cartItemsData: Array<{
			product_id: string
			quantity: number
			price: number
			product_title: string
			selectedColor?: string
			selectedSize?: string
		}> = []

		for (const itemDoc of itemsSnapshot.docs) {
			const item = itemDoc.data()
			const productDoc = await db.collection('products').doc(item.product_id).get()

			if (!productDoc.exists) continue;

			const product = productDoc.data() as ProductType

			const isOnSale = !!product?.discount_price && product.discount_price > 0 && product.discount_price <= 100
			const currentPrice = isOnSale ? product!.price - (product!.price * (product!.discount_price! / 100)) : product!.price

			totalAmount += currentPrice * item.quantity

			cartItemsData.push({
				product_id: item.product_id,
				quantity: item.quantity,
				price: currentPrice,
				product_title: product?.title || '',
				selectedColor: item.selectedColor || undefined,
				selectedSize: item.selectedSize || undefined,
			})
		}

		if (options?.shippingCharge) {
			totalAmount += options.shippingCharge
		}

		const totalAmountInCents = Math.round(totalAmount * 100)

		if (!process.env.POLAR_ACCESS_TOKEN || options?.paymentMethod === 'Cash on Delivery') {
			if (!process.env.POLAR_ACCESS_TOKEN && options?.paymentMethod !== 'Cash on Delivery') {
			    console.warn('POLAR_ACCESS_TOKEN is missing. Returning a mock checkout session and creating a local mock order.');
			}

			const addressRef = await db.collection('addresses').add({
				user_id: userId,
				street: options?.address?.street || '',
				city: options?.address?.city || '',
				state: options?.address?.state || '',
				zip_code: options?.address?.zip_code || '',
				country: 'US',
				is_default: false
			})

			const mockPaymentId = `mock_checkout_${Date.now()}`;
			const orderRef = await db.collection('orders').add({
				user_id: userId,
				total: totalAmount,
				status: 'processing',
				payment_id: mockPaymentId,
				payment_method: options?.paymentMethod || 'mock_checkout',
				shipping_address_id: addressRef.id,
				created_at: new Date()
			})

			for (const item of cartItemsData) {
				await db.collection('order_items').add({
					order_id: orderRef.id,
					product_id: item.product_id,
					quantity: item.quantity,
					price: item.price,
					selectedColor: item.selectedColor || null,
					selectedSize: item.selectedSize || null,
				})
			}

			// Delete Cart Items
			for (const doc of itemsSnapshot.docs) {
				await doc.ref.delete()
			}

			return {
				success: true,
				checkoutUrl: `${baseUrl}/checkout/success?checkout_id=${mockPaymentId}`,
				checkoutId: mockPaymentId,
			}
		}

		const polarProductId = await getPolarProduct()
		const prices: Record<string, Array<{
			amountType: 'fixed'
			priceAmount: number
			priceCurrency: string
			metadata?: Record<string, string>
		}>> = {}

		prices[polarProductId] = [{
			amountType: 'fixed' as const,
			priceAmount: totalAmountInCents,
			priceCurrency: 'usd' as const,
			metadata: {
				cart_items: JSON.stringify(cartItemsData),
				total_items: itemsSnapshot.size.toString(),
				shipping_charge: options?.shippingCharge?.toString() || '0',
				address_state: options?.address?.state || '',
				address_city: options?.address?.city || '',
				address_street: options?.address?.street || '',
				address_zip: options?.address?.zip_code || '',
				address_phone: options?.address?.phone || '',
				payment_method: options?.paymentMethod || 'polar',
			},
		}]

		const checkout = await polar.checkouts.create({
			products: [polarProductId],
			prices: prices as Parameters<typeof polar.checkouts.create>[0]['prices'],
			externalCustomerId: userId,
			successUrl: `${baseUrl}/checkout/success?checkout_id={CHECKOUT_ID}`,
			customerEmail: options?.userEmail || undefined,
		})

		if (!checkout.url) {
			throw new Error('Failed to create checkout session')
		}

		return {
			success: true,
			checkoutUrl: checkout.url,
			checkoutId: checkout.id,
		}
	} catch (error) {
		console.error('Error creating Polar checkout:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Internal server error',
		}
	}
}

export async function getShippingRatesAction() {
	try {
		const snapshot = await db.collection('shipping_rates').get()
		if (snapshot.empty) {
			return []
		}
		
		return snapshot.docs.map(doc => ({
			id: doc.id,
			...(doc.data() as { state: string, district?: string, charge: number })
		}))
	} catch (error) {
		console.error('Error fetching shipping rates from server:', error)
		return []
	}
}

