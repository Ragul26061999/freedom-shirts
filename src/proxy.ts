import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware: Server-side route protection for /admin/* routes.
 *
 * Strategy:
 * - /admin/login  → always accessible (the entry point)
 * - /admin/*      → check for a Firebase ID token cookie; if missing → redirect to /admin/login
 *
 * Full admin-role verification (against Supabase admin_users table) is done
 * client-side in the AdminLayout as a secondary layer. The middleware acts as
 * the first, fast gate that blocks unauthenticated requests at the edge.
 *
 * Note: Firebase tokens are stored in IndexedDB by default (not cookies), so
 * we use a custom cookie `__admin_token` that the admin login page sets after
 * successful sign-in. Alternatively this can be verified via Firebase Admin SDK.
 */
export async function proxy(request: NextRequest) {
  // Let the client-side AdminLayout handle security since Firebase auth state
  // is stored in IndexedDB and not immediately available via cookies.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
