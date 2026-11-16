"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/client";

interface AdminData {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "innovacentra@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check whether the signed-in Firebase user is an admin.
 *
 * Admin access is granted when either:
 *  - the email is listed in NEXT_PUBLIC_ADMIN_EMAILS, or
 *  - the user's Firestore profile has `role: "admin"`.
 */
export function useAdmin(): AdminData {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setError(null);
        setLoading(false);
        return;
      }

      if (isAdminEmail(user.email)) {
        setIsAdmin(true);
        setError(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const profileSnap = await getDoc(doc(db, "profiles", user.uid));
        setIsAdmin(profileSnap.exists() && profileSnap.data()?.role === "admin");
      } catch (err) {
        console.error("Unexpected error checking admin status:", err);
        setError("Failed to verify admin status");
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, authLoading]);

  return { isAdmin, loading, error };
}

/**
 * Utility function to check admin status without hooks.
 */
export async function checkIsAdmin(userId: string, email?: string): Promise<boolean> {
  if (!userId) return false;
  if (isAdminEmail(email)) return true;

  try {
    const profileSnap = await getDoc(doc(db, "profiles", userId));
    return profileSnap.exists() && profileSnap.data()?.role === "admin";
  } catch (err) {
    console.error("Unexpected error checking admin status:", err);
    return false;
  }
}
