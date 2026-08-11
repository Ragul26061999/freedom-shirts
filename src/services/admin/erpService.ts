'use server';

import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseKey);
};

export async function createPurchaseOrder(data: {
  supplier_id: number;
  expected_delivery_date: string;
  notes: string;
  total_cost: number;
  items: { product_id: string; quantity: number; purchase_price: number }[];
}) {
  const supabase = getSupabaseAdmin();

  // Insert PO
  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      supplier_id: data.supplier_id,
      expected_delivery_date: data.expected_delivery_date,
      notes: data.notes,
      total_cost: data.total_cost,
    })
    .select()
    .single();

  if (poError || !po) {
    return { error: poError?.message || 'Failed to create PO' };
  }

  // Insert PO Items
  const poItems = data.items.map((item) => ({
    po_id: po.id,
    product_id: item.product_id,
    quantity: item.quantity,
    purchase_price: item.purchase_price,
  }));

  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(poItems);

  if (itemsError) {
    return { error: itemsError.message };
  }

  return { success: true, po_id: po.id };
}

export async function receivePurchaseOrder(poId: number, receivedItems: { id: number; received_quantity: number; damaged_quantity: number; warehouse_id: number; product_id: string }[]) {
  const supabase = getSupabaseAdmin();
  
  // This should ideally be a Postgres RPC to ensure atomicity
  for (const item of receivedItems) {
    // 1. Update PO item
    await supabase.from('purchase_order_items').update({
      received_quantity: item.received_quantity,
      damaged_quantity: item.damaged_quantity,
      warehouse_id: item.warehouse_id,
    }).eq('id', item.id);
    
    // 2. Update stock (Available and Damaged)
    // RPC is much safer here: fn_receive_purchase_order(product_id, warehouse_id, received_quantity, damaged_quantity)
  }

  await supabase.from('purchase_orders').update({ status: 'received' }).eq('id', poId);
  return { success: true };
}

export async function logStockHistory(data: {
  product_id: string;
  action: 'purchase_received' | 'manual_adjustment' | 'customer_order' | 'customer_return' | 'damaged';
  previous_quantity: number;
  new_quantity: number;
  difference: number;
  reason?: string;
  reference_number?: string;
  purchase_price?: number;
  batch_number?: string;
  manufacturing_date?: string;
  expiry_date?: string;
}) {
  const supabase = getSupabaseAdmin();
  
  const insertData: any = {
    ...data,
    created_at: new Date().toISOString()
  };

  if (data.action === 'purchase_received') {
    insertData.remaining_quantity = data.difference;
  }

  const { error } = await supabase.from('stock_history').insert(insertData);
  if (error) {
    console.error('Failed to log stock history:', error);
    return { error: error.message };
  }
  return { success: true };
}

export async function getProductStockHistory(productId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('stock_history')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to get stock history:', error);
    return { data: [], error: error.message };
  }
  return { data, success: true };
}
