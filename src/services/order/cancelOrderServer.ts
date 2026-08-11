"use server"

import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export async function cancelOrderWithRestock(orderId: string, reason: string, userId: string) {
  try {
    // Initialize admin client to bypass RLS
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Verify the order belongs to the user and is not already cancelled
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !order) {
      throw new Error("Order not found or you don't have permission to cancel it.");
    }

    if (order.status === "cancelled") {
      throw new Error("Order is already cancelled.");
    }

    // 2. Update order status to cancelled
    const { error: cancelError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (cancelError) {
      throw new Error(`Failed to update order status: ${cancelError.message}`);
    }

    // 3. Restock products by calling process_fifo_sale or by directly logging to stock history
    // Since process_fifo_sale handles deduction, we should ideally have a reverse for restocking,
    // but the easiest is to just increment product stock and log to stock_history.
    if (order.order_items && order.order_items.length > 0) {
      for (const item of order.order_items) {
        // Fetch current product stock
        const { data: product } = await supabaseAdmin
          .from("products")
          .select("stock")
          .eq("product_id", item.product_id)
          .single();

        if (product) {
          const newStock = product.stock + item.quantity;
          
          // Update product stock
          await supabaseAdmin
            .from("products")
            .update({ stock: newStock })
            .eq("product_id", item.product_id);

          // Log in stock_history
          await supabaseAdmin
            .from("stock_history")
            .insert({
              product_id: item.product_id,
              action: "customer_return",
              previous_quantity: product.stock,
              new_quantity: newStock,
              difference: item.quantity,
              reason: `Cancelled order: ${orderId}`,
            });
        }
      }
    }

    return { success: true, orderId };
  } catch (error) {
    console.error("Error cancelling order with restock:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to cancel order" 
    };
  }
}
