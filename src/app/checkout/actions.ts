'use server'

import { Polar } from '@polar-sh/sdk'
import { createServerSupabase, getAuthenticatedUser } from '@/lib/supabase/server'
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
	// If product ID is explicitly provided, use it
	const productId = process.env.POLAR_PRODUCT_ID
	if (productId) {
		return productId
	}

	// Otherwise, list existing products and find one
	// When using organization token, don't pass organizationId
	const organizationId = process.env.POLAR_ORG_ID
	const listParams = organizationId ? { organizationId } : {}

	try {
		const productsIterator = await polar.products.list(listParams)

		// Iterate through pages to find first non-archived product
		for await (const page of productsIterator) {
			if (page?.result?.items) {
				const product = page.result.items.find(
					(p: { isArchived?: boolean; id?: string }) => !p.isArchived
				)

				if (product?.id) {
					return product.id
				}
			}
		}

		throw new Error('No active Polar products found. Please create a product in Polar or set POLAR_PRODUCT_ID environment variable.')
	} catch (error) {
		console.error('Error getting Polar product:', error)
		throw new Error(`Failed to get Polar product: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export async function createPolarCheckout(options?: {
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
		// Get authenticated user
		const user = await getAuthenticatedUser()
		if (!user) {
			throw new Error('Unauthorized')
		}

		// Get Supabase client
		const supabase = await createServerSupabase()

		// Get active cart
		const { data: cart, error: cartError } = await supabase
			.from('carts')
			.select('*')
			.eq('user_id', user.id)
			.eq('status', 'active')
			.single()

		if (cartError || !cart) {
			throw new Error('No active cart found')
		}

		// Get cart items with product details
		const { data: cartItems, error: itemsError } = await supabase
			.from('cart_items')
			.select(
				`
				*,
				product:products(*)
			`
			)
			.eq('cart_id', cart.id)

		if (itemsError || !cartItems || cartItems.length === 0) {
			throw new Error('Cart is empty')
		}

		// Get base URL for redirect URLs
		const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

		// Calculate total amount for all cart items
		let totalAmount = 0
		const cartItemsData: Array<{
			product_id: string
			quantity: number
			price: number
			product_title: string
		}> = []

		for (const item of cartItems) {
			const productId = item.product_id
			const product = item.product as ProductType | null | undefined
			
			const isOnSale = !!product?.discount_price && product.discount_price > 0 && product.discount_price <= 100
			const currentPrice = isOnSale ? product!.price - (product!.price * (product!.discount_price! / 100)) : product!.price

			totalAmount += currentPrice * item.quantity
			
			cartItemsData.push({
				product_id: productId,
				quantity: item.quantity,
				price: currentPrice,
				product_title: product?.title || '',
			})
		}

		if (options?.shippingCharge) {
			totalAmount += options.shippingCharge
		}
		
		const totalAmountInCents = Math.round(totalAmount * 100)

		// If POLAR_ACCESS_TOKEN is missing, provide a mock checkout for local development
		// BUT ALSO create the order in the database so God Mode tracking works!
		if (!process.env.POLAR_ACCESS_TOKEN) {
			console.warn('POLAR_ACCESS_TOKEN is missing. Returning a mock checkout session and creating a local mock order.');
			
			// 1. Create Address
			const { data: addressData } = await supabase.from('addresses').insert([{
				user_id: user.id,
				street: options?.address?.street || '',
				city: options?.address?.city || '',
				state: options?.address?.state || '',
				zip_code: options?.address?.zip_code || '',
				country: 'US',
				is_default: false
			}]).select().single()
			
			// 2. Create Order
			const mockPaymentId = `mock_checkout_${Date.now()}`;
			const { data: orderData } = await supabase.from('orders').insert([{
				user_id: user.id,
				total: totalAmount,
				status: 'processing', // Start as processing for tracking
				payment_id: mockPaymentId,
				payment_method: options?.paymentMethod || 'mock_checkout',
				shipping_address_id: addressData?.id
			}]).select().single()
			
			// 3. Create Order Items
			if (orderData) {
				const orderItemsToInsert = cartItemsData.map(item => ({
					order_id: orderData.id,
					product_id: item.product_id,
					quantity: item.quantity,
					price: item.price
				}))
				await supabase.from('order_items').insert(orderItemsToInsert)
				
				// 4. Delete Cart Items
				await supabase.from('cart_items').delete().eq('cart_id', cart.id)
				
				// 5. Reduce stock for each product
				for (const item of cartItemsData) {
					const { data: productData } = await supabase
						.from('products')
						.select('stock')
						.eq('product_id', item.product_id)
						.single()
						
					if (productData && productData.stock !== undefined) {
						const newStock = Math.max(0, productData.stock - item.quantity)
						await supabase
							.from('products')
							.update({ stock: newStock })
							.eq('product_id', item.product_id)
					}
				}
			}
			
			return {
				success: true,
				checkoutUrl: `${baseUrl}/checkout/success?checkout_id=${mockPaymentId}`,
				checkoutId: mockPaymentId,
			}
		}

		// Get existing Polar product
		const polarProductId = await getPolarProduct()

		// Build ad-hoc prices object for Polar
		// Polar only allows ONE static price per product, so we combine all items into a single total
		// Store individual cart items in metadata as JSON for webhook processing
		const prices: Record<string, Array<{
			amountType: 'fixed'
			priceAmount: number
			priceCurrency: string
			metadata?: Record<string, string>
		}>> = {}

		// Single price entry with total amount and all items in metadata
		prices[polarProductId] = [{
			amountType: 'fixed' as const,
			priceAmount: totalAmountInCents,
			priceCurrency: 'usd' as const,
			metadata: {
				cart_items: JSON.stringify(cartItemsData),
				total_items: cartItems.length.toString(),
				shipping_charge: options?.shippingCharge?.toString() || '0',
				address_state: options?.address?.state || '',
				address_city: options?.address?.city || '',
				address_street: options?.address?.street || '',
				address_zip: options?.address?.zip_code || '',
				address_phone: options?.address?.phone || '',
				payment_method: options?.paymentMethod || 'polar',
			},
		}]

		// Create Polar checkout session
		// Use the single Polar product ID with multiple price entries
		const checkout = await polar.checkouts.create({
			products: [polarProductId], // Single Polar product ID
			prices: prices as Parameters<typeof polar.checkouts.create>[0]['prices'],
			externalCustomerId: user.id, // Map to Supabase user ID
			successUrl: `${baseUrl}/checkout/success?checkout_id={CHECKOUT_ID}`,
			customerEmail: user.email || undefined,
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

