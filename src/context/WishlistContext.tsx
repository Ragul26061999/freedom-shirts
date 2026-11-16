"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/context/AuthContext";

interface WishlistContextType {
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_SCOPE = "guest";

/**
 * Wishlists are scoped per Firebase user so switching accounts on the same
 * browser never leaks one customer's saved items into another account.
 */
function storageKeyFor(uid?: string | null) {
  return `innova-wishlist:${uid || GUEST_SCOPE}`;
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const storageKey = storageKeyFor(user?.uid);

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  // Load the wishlist that belongs to the current account.
  useEffect(() => {
    if (authLoading) return;

    try {
      const stored = localStorage.getItem(storageKey);
      setWishlist(stored ? JSON.parse(stored) : []);
    } catch (error) {
      console.error("Failed to parse wishlist from local storage", error);
      setWishlist([]);
    } finally {
      setLoadedKey(storageKey);
    }
  }, [storageKey, authLoading]);

  // Persist only after the correct account bucket has been loaded.
  useEffect(() => {
    if (loadedKey !== storageKey) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
    } catch (error) {
      console.error("Failed to save wishlist", error);
    }
  }, [wishlist, storageKey, loadedKey]);

  const addToWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (!prev.includes(productId)) {
        return [...prev, productId];
      }
      return prev;
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const isInWishlist = (productId: string) => {
    return wishlist.includes(productId);
  };

  const totalItems = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
