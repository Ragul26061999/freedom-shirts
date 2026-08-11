-- 1. Add remaining_quantity to stock_history to track batch exhaustion
ALTER TABLE public.stock_history
ADD COLUMN IF NOT EXISTS remaining_quantity INTEGER DEFAULT 0;

-- 2. Update existing purchase_received rows to have remaining_quantity = difference
UPDATE public.stock_history
SET remaining_quantity = difference
WHERE action = 'purchase_received' AND remaining_quantity = 0;

-- 3. Create a Postgres function to process FIFO sales
CREATE OR REPLACE FUNCTION process_fifo_sale(
  p_product_id UUID,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT 'Sold to customer'
)
RETURNS JSONB AS $$
DECLARE
  v_remaining_to_sell INTEGER := p_quantity;
  v_batch_record RECORD;
  v_deduct INTEGER;
  v_current_global_stock INTEGER;
  v_next_oldest_batch RECORD;
BEGIN
  -- 1. Get current global stock
  SELECT stock INTO v_current_global_stock
  FROM public.products
  WHERE product_id = p_product_id;

  IF v_current_global_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- 2. Loop through oldest available batches (ordered by manufacturing_date ASC, then created_at ASC)
  FOR v_batch_record IN
    SELECT id, remaining_quantity, batch_number, manufacturing_date, expiry_date
    FROM public.stock_history
    WHERE product_id = p_product_id 
      AND action = 'purchase_received' 
      AND remaining_quantity > 0
    ORDER BY COALESCE(manufacturing_date, '1900-01-01'::DATE) ASC, created_at ASC
  LOOP
    IF v_remaining_to_sell <= 0 THEN
      EXIT;
    END IF;

    -- Calculate how much to deduct from this batch
    IF v_batch_record.remaining_quantity >= v_remaining_to_sell THEN
      v_deduct := v_remaining_to_sell;
    ELSE
      v_deduct := v_batch_record.remaining_quantity;
    END IF;

    -- Deduct from the batch
    UPDATE public.stock_history
    SET remaining_quantity = remaining_quantity - v_deduct
    WHERE id = v_batch_record.id;

    -- Log the sale explicitly referencing this batch
    INSERT INTO public.stock_history (
      product_id, action, previous_quantity, new_quantity, difference, reason, batch_number
    ) VALUES (
      p_product_id, 
      'customer_order', 
      v_current_global_stock, 
      v_current_global_stock - v_deduct, 
      -v_deduct, 
      p_reason, 
      v_batch_record.batch_number
    );

    v_current_global_stock := v_current_global_stock - v_deduct;
    v_remaining_to_sell := v_remaining_to_sell - v_deduct;
  END LOOP;

  -- FALLBACK: If there were no batches, or not enough batch stock, deduct the rest
  IF v_remaining_to_sell > 0 THEN
    -- Log the generic sale without a batch number
    INSERT INTO public.stock_history (
      product_id, action, previous_quantity, new_quantity, difference, reason, batch_number
    ) VALUES (
      p_product_id, 
      'customer_order', 
      v_current_global_stock, 
      v_current_global_stock - v_remaining_to_sell, 
      -v_remaining_to_sell, 
      p_reason, 
      NULL
    );

    v_current_global_stock := v_current_global_stock - v_remaining_to_sell;
    v_remaining_to_sell := 0;
  END IF;

  -- Update global stock in products table
  UPDATE public.products
  SET stock = v_current_global_stock
  WHERE product_id = p_product_id;

  -- 3. Update the global manufacturing_date and expiry_date to the NEXT available oldest batch
  SELECT manufacturing_date, expiry_date INTO v_next_oldest_batch
  FROM public.stock_history
  WHERE product_id = p_product_id 
    AND action = 'purchase_received' 
    AND remaining_quantity > 0
  ORDER BY COALESCE(manufacturing_date, '1900-01-01'::DATE) ASC, created_at ASC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.products
    SET manufacturing_date = v_next_oldest_batch.manufacturing_date,
        expiry_date = v_next_oldest_batch.expiry_date
    WHERE product_id = p_product_id;
  ELSE
    -- If no more batches left, we could optionally clear the dates, 
    -- but usually we just leave them or set to NULL. Let's set to NULL.
    UPDATE public.products
    SET manufacturing_date = NULL,
        expiry_date = NULL
    WHERE product_id = p_product_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
