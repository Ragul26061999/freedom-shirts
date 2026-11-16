# Project Documentation

## Introduction

This documentation covers the FSC e-commerce storefront: a single-vendor **Next.js 16** application using **Firebase Authentication** and **Cloud Firestore**.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Firebase, admin, Polar and Cloudinary values.
4. Deploy Firestore rules: `firebase deploy --only firestore:rules`.
5. Start the dev server: `npm run dev`.

## Documentation Index

### Core Documentation

- [Architecture Overview](./architecture.md) — system architecture, data flow and code organization
- [Database Schema](./schema.md) — Firestore collections, document shapes and rules
- [API Documentation](./api.md) — route handlers, services and error handling
- [Project Audit & Plan](./PROJECT_AUDIT_AND_PLAN.md) — historical audit and remaining roadmap

### Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs) — Auth, Firestore and Admin SDK
- [Next.js Documentation](https://nextjs.org/docs) — App Router and server actions
- [TanStack Query Documentation](https://tanstack.com/query/latest) — data fetching and caching
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)

## Common Tasks

### Adding a New Page

1. Create a route folder under `src/app/(store)/<route>/`.
2. Add a `page.tsx` (server component by default).
3. Add the link to `src/components/Navbar.tsx` or `src/components/Footer.tsx`.

### Adding a New Firestore Collection

1. Create the collection and its documents in Firestore.
2. Add matching rules in `firestore.rules` and deploy them.
3. Add the TypeScript shape in `src/types`.
4. Add data access under `src/services/<domain>/`.
5. Document it in [Database Schema](./schema.md).

### Adding a Server Action or Route Handler

1. Put authenticated server logic under `src/app/api/**/route.ts` or a `"use server"` module.
2. Verify the Firebase ID token with `src/lib/auth/server.ts` (`verifyIdToken`, `requireUser`, `requireAdmin`).
3. Use the Firebase Admin SDK (`src/lib/firebase/admin.ts`) for privileged reads/writes.
4. Never trust client-supplied user IDs or prices.

## Troubleshooting

### Authentication Problems

- Confirm the Firebase web API key and auth domain in `.env.local`.
- Ensure Email/Password sign-in is enabled in the Firebase console.
- For password reset, check the authorized domains and that the continue URL `/reset-password/update` is allowed.

### Firestore Permission Errors

- Check `firestore.rules` and deploy the latest rules.
- Confirm the signed-in user's UID matches the document owner.
- Admin writes require either an admin email or `role: "admin"` on the profile.

### Admin Access

- Set `NEXT_PUBLIC_ADMIN_EMAILS` for the client and `ADMIN_EMAILS` for the server.
- Or set `role: "admin"` on the user's `profiles/{uid}` document.

## Contributing

1. Follow the existing structure, naming and formatting.
2. Keep TypeScript and ESLint clean (`npx tsc --noEmit`, `npm run lint`).
3. Verify the app builds (`npm run build`) before opening a pull request.
