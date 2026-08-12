import CheckoutRedirect from "./CheckoutRedirect";

// This is a Server Component by default, no need for 'use client'
export default async function CheckoutPage() {
	// Temporarily bypass server-side auth check since Supabase is not configured
	// on Vercel and auth is being handled via Firebase client-side.
	
	return <CheckoutRedirect />;
}
