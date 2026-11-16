# FSC E-Commerce

A modern single-vendor e-commerce storefront for **Freedom Shirt Co.** built with **Next.js 16 (App Router)**, React 19, TypeScript, Tailwind CSS v4, and **Firebase** (Firestore + Firebase Auth).

The app covers the everyday storefront flow: browse products and categories, search/filter, cart, checkout with Polar/COD, order history, cancellations and returns, reviews, profile management, and a role-gated admin panel for products, inventory, orders and users.

## Features

- 🛍️ **Storefront** — product listing, category pages, product details, reviews and recently viewed items
- 🔐 **Firebase Authentication** — email/password sign-up, sign-in, password reset via Firebase email actions
- 🛒 **Cart & Checkout** — persistent Firestore cart, shipping details, Polar hosted checkout and Cash on Delivery
- 📦 **Orders** — order history, status timeline, cancellation with automatic stock restocking
- ↩️ **Returns** — user-initiated return requests with reasons, proof images and admin review
- 👤 **Profile** — avatar upload, username/email updates, saved profile synced to Firestore
- 👨‍💼 **Admin Panel** — products, categories, inventory, stock history, orders, users and analytics
- ✉️ **Contact** — contact page with a form that stores messages in Firestore (`contact_messages`)
- 🎨 **Modern UI** — shadcn/ui, Tailwind CSS v4, dark mode, responsive layout
- 📊 **Data Fetching** — TanStack Query with server-rendered seed data for the homepage category bar
- 🛡️ **Security** — verified Firebase ID tokens for sensitive server actions, Firestore rules, security headers

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **Backend:** Firebase Auth, Cloud Firestore, Firebase Admin SDK (server-side)
- **Data fetching:** TanStack Query
- **UI:** Tailwind CSS v4, shadcn/ui, Radix UI, Lucide icons, Motion
- **Payments:** Polar (`@polar-sh/sdk`) and Cash on Delivery
- **Media:** Cloudinary + Sharp (product images and avatars)
- **Validation:** Zod

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A Firebase project with **Firestore** and **Email/Password** authentication enabled
- (Optional) Polar, Cloudinary and Firebase Admin service account credentials for payments, uploads and server-side token verification

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your own values.

   ```bash
   cp .env.example .env.local
   ```

   Required groups:

   - **Firebase client** — `NEXT_PUBLIC_FIREBASE_*` keys from the Firebase console
   - **Firebase Admin** — `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (server-only)
   - **Admin access** — `ADMIN_EMAILS` (server) and `NEXT_PUBLIC_ADMIN_EMAILS` (client) as comma-separated lists
   - **Polar** — `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET`, product IDs
   - **Cloudinary** — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - **App** — `NEXT_PUBLIC_SITE_URL`

   > Never commit `.env.local`. Rotate any credentials that were ever committed or shared.

3. **Deploy Firestore rules**

   ```bash
   firebase deploy --only firestore:rules
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000>.

## Available Scripts

- `npm run dev` — start the Next.js dev server with Turbopack
- `npm run build` — build for production
- `npm run start` — start the production server
- `npm run lint` — run ESLint
- `npm run version:patch|minor|major` — bump the package version
- `npm run precommit` — lint and build before committing

## Project Structure

```text
src/
├── app/
│   ├── (store)/                  # Storefront routes
│   │   ├── page.tsx              # Homepage (server-rendered categories)
│   │   ├── products/             # Product listing and details
│   │   ├── contact/              # Contact page + form
│   │   ├── dashboard/            # User dashboard
│   │   ├── profile/              # Profile management
│   │   ├── checkout/             # Checkout flow
│   │   └── (auth)/               # Sign in, sign up, password reset
│   ├── admin/                    # Admin panel (role-gated)
│   └── api/                      # Route handlers (contact, uploads, checkout, webhooks)
├── components/                   # Shared and feature components
├── context/                      # Auth, cart and sidebar providers
├── hooks/                        # Firebase auth and TanStack Query hooks
├── lib/
│   ├── auth/                     # Firebase token verification helpers
│   ├── firebase/                 # Firebase client + Admin SDK setup
│   └── providers/                # App providers
├── services/                     # Firestore-backed data services
├── types/                        # Shared TypeScript types
└── utils/                        # Formatting and error helpers
```

## Authentication & Authorization

- Authentication uses **Firebase Auth** (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`).
- Password reset emails link back to `/reset-password/update`, which validates the Firebase `oobCode` before allowing a password change.
- Admin access is granted when the signed-in user's email is listed in `NEXT_PUBLIC_ADMIN_EMAILS` / `ADMIN_EMAILS`, or their Firestore profile has `role: "admin"`.
- Sensitive server actions (order cancellation, homepage settings, uploads) verify the caller's **Firebase ID token** server-side.

## Firestore Collections

| Collection | Purpose |
|---|---|
| `products` | Catalog items, stock and images |
| `categories` | Storefront categories |
| `carts` / `cart_items` | Active cart per user |
| `orders` / `order_items` | Orders and their line items |
| `returns` | Return requests and admin decisions |
| `reviews` | Product reviews and ratings |
| `profiles` | User profile data keyed by Firebase UID |
| `addresses` | Saved shipping addresses |
| `contact_messages` | Contact form submissions |
| `homepage_settings` | Editable homepage sections (hero, promo banners) |
| `stock_history` | Inventory movement log |

## Documentation

- [Architecture Overview](./docs/architecture.md)
- [Database Schema](./docs/schema.md)
- [API Documentation](./docs/api.md)
- [Project Audit & Plan](./docs/PROJECT_AUDIT_AND_PLAN.md)

## License

This project is licensed under the MIT License.
