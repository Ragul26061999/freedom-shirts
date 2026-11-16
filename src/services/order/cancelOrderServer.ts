"use server";

import { db } from "@/lib/firebase/admin";
import { verifyIdToken } from "@/lib/auth/server";

/**
 * Cancel an order and restock its items.
 *
 * The caller's Firebase ID token is verified server-side, so a user can only
 * cancel their own order regardless of any client-supplied ids.
 */
export async function cancelOrderWithRestock(
  orderId: string,
  reason: string,
  idToken: string
) {
  try {
    const user = await verifyIdToken(idToken);
    if (!user) {
      throw new Error("You must be signed in to cancel an order.");
    }

    if (!db || typeof db.collection !== "function") {
      throw new Error("Database is not available.");
    }

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new Error("Order not found.");
    }

    const order = orderSnap.data()!;

    if (order.user_id !== user.uid) {
      throw new Error("You don't have permission to cancel this order.");
    }

    if (order.status === "cancelled") {
      throw new Error("Order is already cancelled.");
    }

    if (order.status === "delivered" || order.status === "shipped") {
      throw new Error("This order can no longer be cancelled.");
    }

    const itemsSnap = await db
      .collection("order_items")
      .where("order_id", "==", orderId)
      .get();

    const batch = db.batch();

    // Restock each purchased item and record the movement.
    for (const itemDoc of itemsSnap.docs) {
      const item = itemDoc.data();
      if (!item.product_id) continue;

      const productRef = db.collection("products").doc(String(item.product_id));
      const productSnap = await productRef.get();
      if (!productSnap.exists) continue;

      const previousQuantity = Number(productSnap.data()?.stock ?? 0);
      const quantity = Number(item.quantity ?? 0);
      const newQuantity = previousQuantity + quantity;

      batch.update(productRef, { stock: newQuantity, updated_at: new Date() });

      const historyRef = db.collection("stock_history").doc();
      batch.set(historyRef, {
        product_id: String(item.product_id),
        action: "customer_return",
        previous_quantity: previousQuantity,
        new_quantity: newQuantity,
        difference: quantity,
        reason: `Cancelled order: ${orderId}`,
        created_at: new Date(),
      });
    }

    batch.update(orderRef, {
      status: "cancelled",
      cancellation_reason: reason,
      updated_at: new Date(),
    });

    await batch.commit();

    return { success: true, orderId };
  } catch (error) {
    console.error("Error cancelling order with restock:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}
