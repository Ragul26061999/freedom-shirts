-- Add batch details to stock_history table
ALTER TABLE public.stock_history
ADD COLUMN IF NOT EXISTS batch_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE;
