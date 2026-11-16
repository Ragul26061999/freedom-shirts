import { auth } from "@/lib/firebase/admin";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

/** Read a `Authorization: Bearer <token>` header. */
export function getBearerToken(request: Request): string | null {
  const header =
    request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

/** Verify a Firebase ID token on the server. Returns null for invalid tokens. */
export async function verifyIdToken(
  token?: string | null,
): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  // Firebase Admin may not be initialised during build / when env is missing.
  if (!auth || typeof (auth as { verifyIdToken?: unknown }).verifyIdToken !== "function") {
    console.error("Firebase Admin Auth is not initialised — cannot verify tokens.");
    return null;
  }

  try {
    const decoded = await auth.verifyIdToken(token, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch (error) {
    console.warn("Invalid Firebase ID token:", (error as Error)?.message);
    return null;
  }
}

/** Verify the request's bearer token and return the caller. */
export async function requireUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  return verifyIdToken(getBearerToken(request));
}

/** Admin emails are configured in `ADMIN_EMAILS` (comma separated). */
export function getAdminEmails(): string[] {
  const configured =
    process.env.ADMIN_EMAILS ||
    process.env.ADMIN_EMAIL ||
    "innovacentra@gmail.com";
  return configured
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** Verify the caller is signed in AND is an admin. */
export async function requireAdmin(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const user = await requireUser(request);
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
