# Architecture Overview

## Purpose

FSC E-Commerce is a single-vendor storefront built with Next.js 16 (App Router) on Firebase. It covers the customer journey (browse → cart → checkout → order → return) and an admin back office for catalog, inventory, orders and users.

## High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ Browser                                                      │
│  React 19 components, TanStack Query, Firebase client SDK    │
└───────────────┬──────────────────────────────┬───────────────┘
                │ Firestore reads/writes       │ fetch / server actions
                │ (Firestore rules)            │ (Bearer ID token)
┌───────────────▼──────────────┐  ┌────────────▼───────────────┐
│ Cloud Firestore              │  │ Next.js server              │
│  products, orders, carts,    │  │  Route handlers             │
│  profiles, returns, ...      │  │  Server actions             │
└───────────────▲──────────────┘  │  Firebase Admin SDK         │
                │                 │  Token verification         │
                │                 │  Cloudinary / Polar         │
                │                 └────────────┬───────────────┘
                │                              │
        ┌───────┴────────┐            ┌────────▼────────┐
        │ Firebase Auth  │            │ Polar webhooks  │
        └────────────────┘            └─────────────────┘
```

## Layers

### 1. App Router (`src/app`)

- `(store)` routes are public storefront pages: home, products, contact, cart, checkout, dashboard, profile, auth pages.
- `admin` routes are client-protected by `useAdmin` and the admin layout; sensitive mutations additionally verify tokens server-side.
- `api` holds route handlers for contact, product reads, uploads, profile creation and the Polar webhook.

### 2. Components (`src/components`)

UI and feature components. Server components fetch initial data where it prevents layout shift (for example the homepage category bar), while interactive parts are client components.

### 3. Hooks & State (`src/hooks`, `src/context`)

- `useFirebaseAuth` subscribes to `onAuthStateChanged` and maps the Firebase user to a compatibility shape (`uid` + `id`).
- `AuthContext`, `CartContext` and `SidebarContext` provide shared state.
- `src/hooks/queries/*` wrap TanStack Query for products, categories, cart, orders, profile, returns and reviews.

### 4. Services (`src/services`)

Data access is split by domain:

- **Client services** use the Firebase client SDK and are protected by Firestore rules.
- **Server services** (`*ServerService.ts`, `"use server"` modules) use the Firebase Admin SDK and are called from server components or actions.

Domains: `admin`, `cart`, `category`, `homepage`, `order`, `product`, `profile`, `return`, `review`.

### 5. Infrastructure (`src/lib`)

- `firebase/client.ts` — initializes the Firebase web app and exports `auth` and `db`.
- `firebase/admin.ts` — initializes the Admin SDK from `FIREBASE_*` env vars, returning a safe stub when credentials are absent (e.g. during builds).
- `auth/server.ts` — reads bearer tokens and verifies them (`verifyIdToken`, `requireUser`, `requireAdmin`).
- `providers/` — TanStack Query and theme providers.

## Authentication & Authorization

1. The client signs in with Firebase Auth and receives an ID token.
2. Client-side Firestore access is authorized by `firestore.rules` using `request.auth.uid`.
3. Privileged operations send `Authorization: Bearer <idToken>` to a route handler or server action.
4. The server verifies the token and never trusts a client-supplied UID.
5. Admin status is granted by `ADMIN_EMAILS` / `NEXT_PUBLIC_ADMIN_EMAILS` or `profiles/{uid}.role === "admin"`.

Password reset uses Firebase's email action flow. The email link contains an `oobCode`; `/reset-password/update` verifies it with `verifyPasswordResetCode` before calling `confirmPasswordReset`.

## Checkout & Payments

- The client builds a checkout payload from the cart.
- The checkout server action re-reads product prices and stock server-side, then creates the order and items atomically.
- **Polar:** the user is redirected to a hosted checkout. `/api/webhooks/polar` verifies the Standard Webhooks HMAC signature, rejects stale timestamps, and confirms the matching order idempotently while decrementing stock.
- **Cash on Delivery:** orders are created directly with a pending payment state.

## Orders, Cancellation & Returns

- Orders are read through `orderServerService`, which joins order items and products.
- Cancellation runs through `cancelOrderServer.cancelOrderWithRestock`: it verifies the caller's token and ownership, restocks each product and writes `stock_history` in a Firestore batch.
- Returns are stored in `returns`, linked to the order and user, with proof images and an admin-managed status.

## Rendering & Performance

- The homepage is `force-dynamic` and server-renders categories via the Admin SDK, seeding React Query so categories appear in the first paint.
- TanStack Query handles client caching and background refetching.
- Product images use `next/image`; uploads are resized with Sharp and hosted on Cloudinary.
- Turbopack powers development builds.

## Security

- `firestore.rules` restricts client access by owner and role.
- Security headers are configured in `next.config.mjs`.
- Sensitive endpoints require verified Firebase ID tokens.
- Polar webhook signatures are checked against the raw request body with a timing-safe comparison.
- Uploads validate MIME type and size and strip metadata by re-encoding.

## Directory Map

```text
src/
├── app/            # Routes, layouts, API handlers
├── components/     # UI and feature components
├── context/        # React context providers
├── hooks/          # Auth and TanStack Query hooks
├── lib/            # Firebase, auth and provider setup
├── services/       # Firestore data access by domain
├── types.ts        # Shared TypeScript types
└── utils/          # Formatting, errors and helpers
```

## Extending the App

### Adding a feature that reads data

1. Add types to `src/types.ts`.
2. Add a client service (and a server variant if needed).
3. Add a TanStack Query hook under `src/hooks/queries`.
4. Consume the hook in a component.

### Adding a privileged operation

1. Create a `"use server"` module or a route handler.
2. Verify the caller with `verifyIdToken` / `requireUser` / `requireAdmin`.
3. Use the Admin SDK for reads and writes.
4. Validate all inputs and never trust client prices or IDs.

### Adding a collection

1. Update `firestore.rules`.
2. Document the shape in `docs/schema.md`.
3. Add indexes as required by the queries.
