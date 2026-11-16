"use server";

import { db } from "@/lib/firebase/admin";

interface StockHistoryEntry {
  id: string;
  product_id: string;
  action: string;
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  reason?: string;
  reference_number?: string;
  created_at?: string;
  [key: string]: unknown;
}

/**
 * Return the stock movement history for a product from Firestore.
 */
export async function getProductStockHistory(productId: string) {
  try {
    if (!db || typeof db.collection !== "function") {
      return { data: [] as StockHistoryEntry[], error: "Database not connected." };
    }

    const snapshot = await db
      .collection("stock_history")
      .where("product_id", "==", productId)
      .get();

    const data = snapshot.docs
      .map((docSnap) => {
        const raw = docSnap.data();
        const createdAt =
          raw.created_at && typeof raw.created_at.toDate === "function"
            ? raw.created_at.toDate().toISOString()
            : raw.created_at ?? null;

        return {
          id: docSnap.id,
          ...raw,
          created_at: createdAt,
        } as StockHistoryEntry;
      })
      .sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      );

    return { data, success: true };
  } catch (error) {
    console.error("Failed to get stock history:", error);
    return {
      data: [] as StockHistoryEntry[],
      error: error instanceof Error ? error.message : "Failed to get stock history",
    };
  }
}
