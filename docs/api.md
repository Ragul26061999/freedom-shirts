# API Documentation

## Overview

The app has two data-access layers:

1. **Route handlers** under `src/app/api/**` for unauthenticated reads and privileged server work.
2. **Firestore-backed services** under `src/services/**`, used directly by client components and React Query hooks (protected by Firestore rules) and by server components via the Firebase Admin SDK.

Authentication is handled by **Firebase Auth**. Privileged endpoints expect a bearer token:

```http
Authorization: Bearer <firebase-id-token>
```

`src/lib/auth/server.ts` provides `getBearerToken`, `verifyIdToken`, `requireUser` and `requireAdmin`.

## Route Handlers

### `POST /api/auth/profile`

Creates the caller's `profiles/{uid}` document if it does not exist, or fills in a missing email.

- **Auth:** required (bearer token)
- **Body:** none; the UID comes from the verified token
- **Returns:** `{ success: true }` or `{ error }`

### `GET /api/contact`

Not implemented; contact uses `POST`.

### `POST /api/contact`

Validates and stores a contact message.

- **Body:** `{ name, email, phone?, subject?, message }`
- **Validation:** name (≤120), valid email (≤200), message (≤5000), phone (≤40), subject (≤200)
- **Writes:** `contact_messages` with `status: "new"` and `createdAt`
- **Returns:** `201 { success: true }`, `400` on validation failure

### `GET /api/products`

Returns products from Firestore, optionally filtered.

- **Query:** `?category_id=<id>`
- **Returns:** `{ products: [...] }`

### `GET /api/products/[id]`

Returns a single product with its category attached.

- **Returns:** `{ product }`, or `404 { product: null }`

### `POST /api/admin/upload-image`

Admin-only product image upload.

- **Auth:** admin bearer token
- **Body:** `multipart/form-data` with `image`
- **Processing:** Sharp resize/re-encode; uploads to Cloudinary
- **Returns:** `{ url }`

### `POST /api/profile/upload-avatar`

Authenticated avatar upload.

- **Auth:** required (bearer token)
- **Body:** `multipart/form-data` with `image`
- **Limits:** 5 MB; JPG/PNG/WebP/GIF/AVIF
- **Processing:** Sharp rotate + 512×512 cover + WebP; uploads to `ecommerce/avatars/{uid}`
- **Returns:** `{ url }`

### `POST /api/webhooks/polar`

Receives Polar payment webhooks.

- **Auth:** Standard Webhooks HMAC signature (`webhook-id`, `webhook-timestamp`, `webhook-signature`)
- **Replay protection:** timestamp must be within 5 minutes
- **Behaviour:** verifies the signature against the raw body, then confirms the order, records the payment ID and decrements stock idempotently
- **Runtime:** Node.js

## Data Services

### Categories

- `categoryService.getCategories()` — client Firestore read
- `categoryService.getCategoryById(id)` — client Firestore read
- `categoryServerService.getCategories()` — server read for the homepage; returns `[]` on failure so rendering never breaks

### Products

- `productService` — client reads and queries
- `productServerService` — server-side reads used by detail pages

### Cart

- `cartService` — active cart lookup, item add/update/remove, cart creation and clearing, all in Firestore

### Orders

- `orderServerService.getOrders(userId)` — joins orders, items and products for the dashboard/profile
- `cancelOrderServer.cancelOrderWithRestock(orderId, reason, idToken)` — verifies the token, checks ownership and status, restocks each product and writes `stock_history` in a Firestore batch

### Profile

- `profileService.getProfileById`, `getCurrentProfile`, `updateProfile`, `updateCurrentProfile`, `deleteProfile`
- `profileService.uploadAvatar` — posts to `/api/profile/upload-avatar`
- `profileServerService` — server reads/writes for profile pages

### Homepage Settings

- `getHomepageSettings(sectionName)` — server action reading `homepage_settings/{sectionName}`
- `updateHomepageSettings(sectionName, contentJson, idToken)` — server action that verifies an admin token, writes the section and revalidates `/`

### Admin

- `adminProductService`, `adminOrderService`, `adminReturnService`, `adminUserService`, `adminUserServerService`, `shippingService`
- `erpService.getProductStockHistory(productId)` — reads `stock_history`

### Returns & Reviews

- `returnService` — create/read/update return requests
- `reviewService` — list/create product reviews

## Error Handling

`src/utils/errorHandling.ts` normalises errors for React Query and UI:

- `toUserFacingQueryError(subject, error)` — maps network/permission failures to readable messages
- `handleCommonErrors(error, options)` — logs and optionally shows a toast
- `trySafe(fn, options)` — wraps an async call with a fallback
- `UNABLE_TO_REACH_DATABASE` — shared substring for connectivity errors

## Data Flow Examples

### Sign-up / First Profile

1. The client creates a Firebase Auth user.
2. The client posts to `/api/auth/profile` with its ID token.
3. The route creates `profiles/{uid}` with `role: "admin"` for configured admin emails, otherwise `"user"`.

### Checkout

1. The client builds an order payload from the Firestore cart.
2. The checkout server action re-fetches prices/stock server-side and writes the order in a transaction.
3. Polar checkout redirects the user; the webhook confirms payment and decrements stock.
4. COD orders are written with a pending payment state.

### Order Cancellation

1. The client requests cancellation with its ID token.
2. `cancelOrderWithRestock` verifies the token and order ownership.
3. Products are restocked and `stock_history` entries are written in one batch.
4. The order is marked `cancelled` with the supplied reason.
