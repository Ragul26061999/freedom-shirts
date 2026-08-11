-- Migration to add manufacturing and expiry dates to products

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS manufacturing_date DATE,
ADD COLUMN IF NOT EXISTS expiry_date DATE;
