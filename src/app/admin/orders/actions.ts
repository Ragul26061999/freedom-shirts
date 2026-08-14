'use server'

import { createClient } from '@supabase/supabase-js'

export async function updateOrderStatusAction(orderId: number, status: string) {
  try {
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return { success: false, error: `Invalid status: ${status}` };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    // Create admin client bypassing RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const updatePayload: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };

    if (status === "delivered") {
      updatePayload.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error("Supabase Admin Update Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error("Failed to update order status:", err);
    return { success: false, error: err.message || 'Failed to update order status' };
  }
}
