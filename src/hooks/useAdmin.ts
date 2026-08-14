"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

interface AdminData {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to check if the current user has admin privileges
 * Uses the admin_users view which filters profiles where role='admin'
 */
export function useAdmin(): AdminData {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If Firebase Auth is still initializing the user session on page reload/mount, keep loading true!
    if (authLoading) {
      setLoading(true);
      return;
    }

    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Force admin status for the designated admin email
      if (user.email === 'innovacentra@gmail.com') {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if user exists in admin_users view
        const { data, error: queryError } = await supabase
          .from("admin_users")
          .select("profile_id")
          .eq("profile_id", user.id)
          .single();

        if (queryError) {
          // If no rows returned, user is not admin
          if (queryError.code === "PGRST116" || queryError.message?.includes("Failed to fetch")) {
            setIsAdmin(false);
          } else {
            setError("Failed to verify admin status");
            setIsAdmin(false);
          }
        } else {
          // User found in admin_users view
          setIsAdmin(!!data);
        }
      } catch (err: any) {
        console.error("Unexpected error checking admin status:", err?.message || err);
        setError("Unexpected error occurred");
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
 * Utility function to check admin status without hooks
 * Useful for server-side or one-time checks
 */
export async function checkIsAdmin(userId: string, email?: string): Promise<boolean> {
  if (!userId) return false;
  if (email === 'innovacentra@gmail.com') return true;

  try {
    const { data, error } = await supabase
      .from("admin_users")
      .select("profile_id")
      .eq("profile_id", userId)
      .single();

    if (error) {
      // If no rows returned, user is not admin
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("Error checking admin status:", error?.message || JSON.stringify(error));
      return false;
    }

    return !!data;
  } catch (err: any) {
    console.error("Unexpected error checking admin status:", err?.message || err);
    return false;
  }
}
