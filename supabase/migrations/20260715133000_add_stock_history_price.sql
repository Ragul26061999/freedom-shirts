-- Add purchase_price to stock_history table
ALTER TABLE public.stock_history
ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(10, 2);
