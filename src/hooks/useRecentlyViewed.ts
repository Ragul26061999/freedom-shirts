"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductType } from "@/types";
import { useAuth } from "@/context/AuthContext";

const MAX_ITEMS = 12;
const GUEST_SCOPE = "guest";

/**
 * Recently viewed products are scoped per Firebase user.
 *
 * This prevents one account (for example an admin) from seeing another
 * account's browsing history on the same browser. Guests get their own bucket.
 */
function storageKeyFor(uid?: string | null) {
  return `innova-recently-viewed:${uid || GUEST_SCOPE}`;
}

export function useRecentlyViewed() {
  const { user } = useAuth();
  const scopeKey = storageKeyFor(user?.uid);
  const [recentProducts, setRecentProducts] = useState<ProductType[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Load the history for the active user (or guest) whenever the scope changes.
  useEffect(() => {
    setIsMounted(false);
    try {
      const stored = localStorage.getItem(scopeKey);
      setRecentProducts(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error("Failed to parse recently viewed products", error);
      setRecentProducts([]);
    } finally {
      setIsMounted(true);
    }
  }, [scopeKey]);

  const addProduct = useCallback(
    (product: ProductType) => {
      setRecentProducts((prev) => {
        const filtered = prev.filter((p) => p.product_id !== product.product_id);
        const updated = [product, ...filtered].slice(0, MAX_ITEMS);
        try {
          localStorage.setItem(scopeKey, JSON.stringify(updated));
        } catch (error) {
          console.error("Failed to save recently viewed products", error);
        }
        return updated;
      });
    },
    [scopeKey],
  );

  return { recentProducts: isMounted ? recentProducts : [], addProduct };
}
