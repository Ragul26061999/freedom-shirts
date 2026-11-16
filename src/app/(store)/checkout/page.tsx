import CheckoutRedirect from "./CheckoutRedirect";

// This is a Server Component by default, no need for 'use client'
export default async function CheckoutPage() {
	// Authentication is handled by Firebase on the client and verified again in the checkout server action.
	// on Vercel and auth is being handled via Firebase client-side.
	
	return <CheckoutRedirect />;
}
