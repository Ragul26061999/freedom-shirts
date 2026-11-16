import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { FieldValue, DocumentReference } from 'firebase-admin/firestore'
import { db } from '@/lib/firebase/admin'
import { ProductType } from '@/types'

export const runtime = 'nodejs'

type ProductVariant = {
  color: string
  images?: string[]
  sizes?: Array<{ size: string; stock: number }>
}

type FirestoreOrder = {
  user_id?: string
  total?: number
  status?: string
  payment_status?: string
  payment_id?: string
  polar_checkout_id?: string
  cart_id?: string
  idempotency_key?: string
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/**
 * Polar uses the Standard Webhooks spec:
 *   signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`
 *   signature      = base64(HMAC-SHA256(base64decode(secret), signed content))
 * Header: `webhook-signature: v1,<base64>` (space separated for rotation).
 */
function verifyStandardWebhook(
  payload: string,
  request: NextRequest,
  secret: string,
): boolean {
  const id = request.headers.get('webhook-id')
  const timestamp = request.headers.get('webhook-timestamp')
  const signatureHeader = request.headers.get('webhook-signature')
  if (!id || !timestamp || !signatureHeader) return false

  const timestampSeconds = Number(timestamp)
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 5 * 60
  ) {
    return false
  }

  const signedContent = `${id}.${timestamp}.${payload}`
  const secrets: Buffer[] = []
  const withoutPrefix = secret.replace(/^whsec_/, '')
  try {
    const decoded = Buffer.from(withoutPrefix, 'base64')
    if (decoded.length > 0) secrets.push(decoded)
  } catch {
    // ignore
  }
  secrets.push(Buffer.from(secret, 'utf8'))

  const expectedSignatures = secrets.map((key) =>
    createHmac('sha256', key).update(signedContent).digest('base64'),
  )

  return signatureHeader.split(' ').some((part) => {
    const [version, signature] = part.split(',')
    return (
      version === 'v1' &&
      !!signature &&
      expectedSignatures.some((expected) => safeEqual(expected, signature))
    )
  })
}

/** Backwards-compatible verifier for the old `polar-signature` hex header. */
function verifyLegacyWebhook(
  payload: string,
  request: NextRequest,
  secret: string,
): boolean {
  const signature = request.headers.get('polar-signature')
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  return safeEqual(expected, signature)
}

function decrementVariants(
  product: ProductType,
  color: string | undefined,
  size: string | undefined,
  qty: number,
): ProductVariant[] | null {
  if (!Array.isArray(product.variants) || product.variants.length === 0) return null
  if (!color && !size) return null

  const variants = JSON.parse(JSON.stringify(product.variants)) as ProductVariant[]
  const colour = color
    ? variants.find((v) => v.color?.toLowerCase() === color.toLowerCase())
    : variants.length === 1
      ? variants[0]
      : undefined
  if (!colour?.sizes) return null

  const sizeRow = size
    ? colour.sizes.find((s) => s.size?.toLowerCase() === size.toLowerCase())
    : colour.sizes.length === 1
      ? colour.sizes[0]
      : undefined
  if (!sizeRow) return null
  if (sizeRow.stock < qty) {
    throw new StockError(`Variant stock exhausted for ${product.title}`)
  }

  sizeRow.stock -= qty
  return variants
}

class StockError extends Error {}

type NormalizedPayment = {
  checkoutId?: string
  amountCents?: number
  currency?: string
  externalCustomerId?: string
  metadata: Record<string, unknown>
  paid: boolean
}

type UnknownRecord = Record<string, unknown>

function record(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object'
    ? (value as UnknownRecord)
    : {}
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normalizeEvent(event: UnknownRecord): NormalizedPayment {
  const data = record(event.data)
  const checkout = record(data.checkout)

  if (Object.keys(checkout).length > 0) {
    const lineItems = Array.isArray(data.line_items) ? data.line_items : []
    const first = record(lineItems[0])
    const priceMetadata = record(record(first.price).metadata)

    return {
      checkoutId: text(checkout.id),
      amountCents:
        numberValue(checkout.amount) ?? numberValue(checkout.total_amount),
      currency: text(checkout.currency),
      externalCustomerId:
        text(record(checkout.customer).external_id) ??
        text(record(data.customer).external_id),
      metadata: { ...priceMetadata, ...record(checkout.metadata) },
      paid:
        checkout.payment_status === 'paid' ||
        checkout.status === 'succeeded' ||
        event.type === 'checkout.succeeded',
    }
  }

  // Newer Polar API: `order.paid`
  if (event.type === 'order.paid') {
    return {
      checkoutId:
        text(data.checkout_id) ?? text(record(data.checkout).id),
      amountCents:
        numberValue(data.total_amount) ?? numberValue(data.amount),
      currency: text(data.currency),
      externalCustomerId: text(record(data.customer).external_id),
      metadata: record(data.metadata),
      paid: true,
    }
  }

  return { metadata: {}, paid: false }
}

async function findOrder(payment: NormalizedPayment) {
  const metadataOrderId = payment.metadata?.order_id
  if (typeof metadataOrderId === 'string' && metadataOrderId) {
    const doc = await db.collection('orders').doc(metadataOrderId).get()
    if (doc.exists) return doc
  }

  if (payment.checkoutId) {
    const byCheckout = await db
      .collection('orders')
      .where('polar_checkout_id', '==', payment.checkoutId)
      .limit(1)
      .get()
    if (!byCheckout.empty) return byCheckout.docs[0]

    const byPayment = await db
      .collection('orders')
      .where('payment_id', '==', payment.checkoutId)
      .limit(1)
      .get()
    if (!byPayment.empty) return byPayment.docs[0]
  }

  if (payment.externalCustomerId) {
    const pending = await db
      .collection('orders')
      .where('user_id', '==', payment.externalCustomerId)
      .where('status', '==', 'pending_payment')
      .limit(1)
      .get()
    if (!pending.empty) return pending.docs[0]
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 503 },
      )
    }

    const payload = await request.text()

    const valid =
      verifyStandardWebhook(payload, request, webhookSecret) ||
      verifyLegacyWebhook(payload, request, webhookSecret)

    if (!valid) {
      console.error('Invalid Polar webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(payload) as UnknownRecord
    const payment = normalizeEvent(event)

    // Acknowledge non-payment events so Polar stops retrying them.
    if (!payment.paid) {
      return NextResponse.json({ received: true, ignored: true })
    }

    const orderDoc = await findOrder(payment)
    if (!orderDoc) {
      console.error('Webhook: no matching order for checkout', payment.checkoutId)
      return NextResponse.json({ error: 'Order not found' }, { status: 400 })
    }

    const order = orderDoc.data() as FirestoreOrder

    // Idempotency: a replayed webhook must not double-process.
    if (order.payment_status === 'paid') {
      return NextResponse.json({ received: true, alreadyProcessed: true })
    }

    const expectedCents = Math.round((Number(order.total) || 0) * 100)
    if (
      typeof payment.amountCents === 'number' &&
      Math.abs(payment.amountCents - expectedCents) > 1
    ) {
      console.error('Webhook amount mismatch', {
        orderId: orderDoc.id,
        expectedCents,
        received: payment.amountCents,
      })
      await orderDoc.ref.update({
        payment_status: 'amount_mismatch',
        updated_at: FieldValue.serverTimestamp(),
      })
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 409 })
    }

    // Load order items before the transaction (all reads must precede writes).
    const itemsSnapshot = await db
      .collection('order_items')
      .where('order_id', '==', orderDoc.id)
      .get()
    const items = itemsSnapshot.docs.map((doc) => ({
      product_id: String(doc.data().product_id),
      quantity: Number(doc.data().quantity) || 0,
      selectedColor: doc.data().selectedColor || undefined,
      selectedSize: doc.data().selectedSize || undefined,
    }))

    if (items.length === 0) {
      console.error('Webhook: order has no items', orderDoc.id)
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 })
    }

    const qtyByProduct = new Map<string, number>()
    for (const item of items) {
      qtyByProduct.set(
        item.product_id,
        (qtyByProduct.get(item.product_id) ?? 0) + item.quantity,
      )
    }

    try {
      await db.runTransaction(async (transaction) => {
        const freshOrder = await transaction.get(orderDoc.ref)
        if ((freshOrder.data() as FirestoreOrder)?.payment_status === 'paid') return

        const productRefs = Array.from(qtyByProduct.keys()).map((id) =>
          db.collection('products').doc(id),
        )
        const productDocs = await Promise.all(
          productRefs.map((ref) => transaction.get(ref)),
        )

        const updates: Array<{
          ref: DocumentReference
          data: Record<string, unknown>
        }> = []

        productDocs.forEach((doc, index) => {
          if (!doc.exists) {
            throw new StockError(`Product ${doc.id} no longer exists`)
          }
          const product = {
            ...(doc.data() as ProductType),
            product_id: doc.id,
          }
          const qty = qtyByProduct.get(doc.id) ?? 0
          const stock = Number(product.stock) || 0
          if (qty > stock) {
            throw new StockError(`Insufficient stock for ${product.title}`)
          }

          let variants: ProductVariant[] | null = null
          for (const item of items.filter((i) => i.product_id === doc.id)) {
            const updated = decrementVariants(
              product,
              item.selectedColor,
              item.selectedSize,
              item.quantity,
            )
            if (updated) variants = updated
          }

          const data: Record<string, unknown> = {
            stock: stock - qty,
            updated_at: FieldValue.serverTimestamp(),
          }
          if (variants) data.variants = variants
          updates.push({ ref: productRefs[index], data })
        })

        const cartId = order.cart_id
        let cartItemRefs: DocumentReference[] = []
        if (cartId) {
          const cartItems = await transaction.get(
            db.collection('cart_items').where('cart_id', '==', cartId),
          )
          cartItemRefs = cartItems.docs.map((doc) => doc.ref)
        }

        // --- Writes ---
        for (const update of updates) {
          transaction.update(update.ref, update.data)
        }

        transaction.update(orderDoc.ref, {
          status: 'processing',
          payment_status: 'paid',
          payment_id: payment.checkoutId || order.payment_id || null,
          polar_checkout_id: payment.checkoutId || order.polar_checkout_id || null,
          gateway: 'polar',
          currency: payment.currency || 'INR',
          paid_at: FieldValue.serverTimestamp(),
          updated_at: FieldValue.serverTimestamp(),
        })

        transaction.set(db.collection('order_status_history').doc(), {
          order_id: orderDoc.id,
          from_status: order.status || 'pending_payment',
          to_status: 'processing',
          actor_id: 'system',
          actor_role: 'system',
          note: 'Payment captured via Polar webhook',
          created_at: FieldValue.serverTimestamp(),
        })

        for (const ref of cartItemRefs) transaction.delete(ref)
        if (cartId) {
          transaction.set(
            db.collection('carts').doc(cartId),
            { status: 'converted', updated_at: FieldValue.serverTimestamp() },
            { merge: true },
          )
        }
      })
    } catch (error) {
      if (error instanceof StockError) {
        // Money was captured but stock is gone. Flag for an automatic/manual refund.
        await orderDoc.ref.update({
          status: 'payment_failed',
          payment_status: 'paid_stock_unavailable',
          requires_refund: true,
          refund_reason: 'Stock unavailable after payment captured',
          updated_at: FieldValue.serverTimestamp(),
        })
        console.error('Webhook: paid order could not be fulfilled', orderDoc.id, error.message)
        return NextResponse.json({ received: true, needsRefund: true })
      }
      throw error
    }

    return NextResponse.json({
      received: true,
      orderId: orderDoc.id,
    })
  } catch (error) {
    console.error('Error processing Polar webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
