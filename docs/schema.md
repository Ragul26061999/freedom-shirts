# Database Schema Documentation

## Overview

The data layer is **Cloud Firestore** (Firebase). Data is organized as top-level collections whose documents use the IDs provided by Firestore. Firebase Authentication owns user identities; the Firestore `profiles` document uses the Firebase UID as its document ID.

Types are declared in `src/types.ts`. Access rules live in `firestore.rules`.

## Common Query Patterns

### Products in a category

```ts
const snapshot = await getDocs(
  query(collection(db, 'products'), where('category_id', '==', categoryId))
);
```

### Orders for a user

```ts
const snapshot = await getDocs(
  query(collection(db, 'orders'), where('user_id', '==', uid))
);
```

### Items in an order

```ts
const snapshot = await getDocs(
  query(collection(db, 'order_items'), where('order_id', '==', orderId))
);
```

### Reviews for a product

```ts
const snapshot = await getDocs(
  query(collection(db, 'reviews'), where('product_id', '==', productId))
);
```

### Default shipping address

```ts
const snapshot = await getDocs(
  query(
    collection(db, 'addresses'),
    where('user_id', '==', uid),
    where('is_default', '==', true)
  )
);
```

## Collections

### `profiles/{uid}`

| Field | Type | Notes |
|---|---|---|
| `profile_id` | string | Same as the Firebase UID |
| `username` | string | Display name |
| `email` | string | Kept in sync with Auth |
| `avatar_url` | string | Cloudinary URL |
| `role` | `"admin" \| "user"` | Drives admin access |
| `created_at` | timestamp | ISO string or Firestore timestamp |
| `updated_at` | timestamp | Updated on writes |

**Rules:** users read/update their own document; admins may read all.

### `products/{productId}`

| Field | Type | Notes |
|---|---|---|
| `title` | string | Product name |
| `description` | string | Long description |
| `price` | number | Base price |
| `discount_price` | number? | Optional offer price |
| `offer_start_date` / `offer_end_date` | string? | Offer window |
| `image` | string? | Main image URL |
| `stock` | number | Available units |
| `sku` | string? | Stock keeping unit |
| `category_id` | number \| string? | References `categories` |
| `variants` | array? | `{ color, images, sizes: [{ size, stock }] }` |
| `created_at` / `updated_at` | timestamp | Audit fields |

**Rules:** public read; admin-only writes.

### `categories/{categoryId}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Category name |
| `description` | string | Description or image URL |
| `parent_id` | number? | Optional parent category |

**Rules:** public read; admin-only writes.

### `carts/{cartId}`

| Field | Type | Notes |
|---|---|---|
| `user_id` | string | Firebase UID |
| `status` | `"active" \| "abandoned" \| "converted"` | Cart lifecycle |
| `total_items` | number | Cached count |
| `total_price` | number | Cached total |
| `created_at` / `updated_at` | timestamp | Audit fields |

### `cart_items/{cartItemId}`

| Field | Type | Notes |
|---|---|---|
| `cart_id` | string | Parent cart |
| `product_id` | string | Product reference |
| `quantity` | number | Units |
| `price` | number | Unit price at add time |
| `selectedColor` / `selectedSize` | string? | Variant selection |

**Rules:** a user may read/write only items belonging to their own cart.

### `orders/{orderId}`

| Field | Type | Notes |
|---|---|---|
| `user_id` | string | Firebase UID |
| `status` | `pending \| processing \| shipped \| delivered \| cancelled` | Order state |
| `total` | number | Order total |
| `shipping_address_id` | number \| string | Address reference |
| `payment_method` | string? | `polar` or `cod` |
| `payment_id` | string? | Gateway reference |
| `payment_status` | string? | Payment state |
| `polar_checkout_id` | string? | Polar checkout reference |
| `idempotency_key` | string? | Webhook/payment dedupe |
| `cancellation_reason` | string? | Set on cancel |
| `created_at` / `updated_at` / `delivered_at` | timestamp | Audit fields |

**Rules:** users read/create their own orders; status updates from the client are limited; server actions use the Admin SDK.

### `order_items/{itemId}`

| Field | Type | Notes |
|---|---|---|
| `order_id` | string | Parent order |
| `product_id` | string | Product reference |
| `quantity` | number | Units |
| `price` | number | Unit price at purchase |
| `selectedColor` / `selectedSize` | string? | Variant selection |

### `addresses/{addressId}`

| Field | Type | Notes |
|---|---|---|
| `user_id` | string | Firebase UID |
| `street` | string | Street address |
| `city` | string | City |
| `state` | string? | State |
| `zip_code` | string | Postal code |
| `country` | string | Country |
| `is_default` | boolean | Default address flag |

### `reviews/{reviewId}`

| Field | Type | Notes |
|---|---|---|
| `product_id` | string | Reviewed product |
| `user_id` | string | Author UID |
| `rating` | number | 1–5 |
| `comment` | string? | Review text |
| `created_at` | timestamp | Creation date |

**Rules:** public read; authenticated users create/update their own reviews.

### `returns/{returnId}`

| Field | Type | Notes |
|---|---|---|
| `order_id` | number \| string | Related order |
| `user_id` | string | Customer UID |
| `items` | array | `{ product_id, title, image, quantity, price, selectedColor?, selectedSize? }` |
| `reason_category` | enum | `size_issue`, `defective_damaged`, `wrong_item`, `quality_issue`, `not_as_described`, `other` |
| `detailed_reason` | string | Customer explanation |
| `proof_images` | string[]? | Cloudinary URLs |
| `preferred_resolution` | enum | `refund`, `replacement`, `store_credit` |
| `status` | enum | `pending`, `approved`, `rejected`, `pickup_scheduled`, `received`, `completed` |
| `admin_notes` | string? | Admin response |
| `restocked` | boolean? | Whether stock was returned |
| `refund_amount` | number | Expected refund |
| `refund_status` | enum? | `pending`, `processed`, `failed` |
| `created_at` / `updated_at` | timestamp | Audit fields |

### `contact_messages/{messageId}`

| Field | Type | Notes |
|---|---|---|
| `name` | string | Sender name |
| `email` | string | Sender email |
| `phone` | string | Optional phone |
| `subject` | string | Defaults to "General enquiry" |
| `message` | string | Message body |
| `status` | string | `"new"` on creation |
| `createdAt` | timestamp | Server timestamp |

### `homepage_settings/{sectionName}`

| Field | Type | Notes |
|---|---|---|
| `content_json` | object \| array | Hero slides or promo banners |
| `updated_at` | timestamp | Last edit |

Sections currently used: `hero_section`, `promo_banners`.

### `stock_history/{entryId}`

| Field | Type | Notes |
|---|---|---|
| `product_id` | string | Product reference |
| `action` | string | e.g. `customer_return` |
| `previous_quantity` | number | Stock before |
| `new_quantity` | number | Stock after |
| `difference` | number | Delta |
| `reason` | string? | Human-readable reason |
| `created_at` | timestamp | Movement date |

## Relationships

Firestore has no foreign keys, so references are stored by ID and joined in the service layer:

- `profiles.profile_id` → `orders.user_id`, `addresses.user_id`, `reviews.user_id`, `returns.user_id`
- `orders.id` → `order_items.order_id`, `returns.order_id`
- `products.product_id` → `order_items.product_id`, `reviews.product_id`, `stock_history.product_id`
- `categories.id` → `products.category_id`
- `carts.id` → `cart_items.cart_id`

## Indexes

Composite indexes may be required for queries combining filters, for example:

- `orders`: `user_id` + `created_at`
- `order_items`: `order_id`
- `reviews`: `product_id` + `created_at`
- `addresses`: `user_id` + `is_default`
- `stock_history`: `product_id` + `created_at`

Create missing indexes from the link Firestore prints when a query needs one.

## Security Notes

- `firestore.rules` is the source of truth for client access. Deploy it with `firebase deploy --only firestore:rules`.
- Product and category reads are public; writes are admin-only.
- Users may only read/write their own carts, orders and profile.
- Admin actions run through the **Admin SDK** in server actions after verifying a Firebase ID token, so they bypass client rules safely.
- Never trust prices, totals or user IDs supplied by the client for checkout or cancellation.
