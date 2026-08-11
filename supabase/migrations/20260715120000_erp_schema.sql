-- ERP Management System Schema Addition for E-commerce App

-- 1. Custom Types for ERP
DO $$ BEGIN
    CREATE TYPE warehouse_stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'incoming');
    CREATE TYPE po_status AS ENUM ('draft', 'sent', 'approved', 'partially_received', 'received', 'cancelled');
    CREATE TYPE return_status AS ENUM ('requested', 'approved', 'rejected', 'pickup_scheduled', 'picked_up', 'received', 'inspection', 'refunded', 'replacement_sent', 'completed');
    CREATE TYPE stock_history_action AS ENUM ('purchase_received', 'customer_order', 'customer_return', 'damaged', 'manual_adjustment', 'supplier_return', 'warehouse_transfer');
    CREATE TYPE return_reason AS ENUM ('wrong_item', 'damaged', 'defective', 'size_issue', 'quality_issue', 'other', 'expired');
    CREATE TYPE item_condition AS ENUM ('good', 'damaged', 'opened', 'used', 'defective', 'missing_parts');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create ERP Tables

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    location VARCHAR,
    manager_id UUID REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default Warehouse Insertion
INSERT INTO public.warehouses (name, location) VALUES ('Main Warehouse', 'Central') ON CONFLICT DO NOTHING;

-- Product Warehouse Stock
CREATE TABLE IF NOT EXISTS public.product_warehouse_stock (
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    available_stock INTEGER NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
    damaged_stock INTEGER NOT NULL DEFAULT 0 CHECK (damaged_stock >= 0),
    incoming_stock INTEGER NOT NULL DEFAULT 0 CHECK (incoming_stock >= 0),
    min_stock_level INTEGER DEFAULT 10,
    max_stock_level INTEGER DEFAULT 1000,
    reorder_level INTEGER DEFAULT 20,
    PRIMARY KEY (product_id, warehouse_id)
);

-- Stock History
CREATE TABLE IF NOT EXISTS public.stock_history (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE CASCADE,
    action stock_history_action NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    difference INTEGER NOT NULL,
    reason TEXT,
    user_id UUID REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    reference_number VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    company VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    gst_number VARCHAR,
    address TEXT,
    payment_terms VARCHAR,
    status VARCHAR DEFAULT 'active',
    outstanding_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    status po_status DEFAULT 'draft',
    expected_delivery_date DATE,
    notes TEXT,
    total_cost NUMERIC NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
    created_by UUID REFERENCES public.profiles(profile_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK (received_quantity >= 0 AND received_quantity <= quantity),
    damaged_quantity INTEGER NOT NULL DEFAULT 0 CHECK (damaged_quantity >= 0 AND damaged_quantity <= quantity),
    purchase_price NUMERIC NOT NULL CHECK (purchase_price >= 0),
    tax NUMERIC DEFAULT 0 CHECK (tax >= 0),
    discount NUMERIC DEFAULT 0 CHECK (discount >= 0),
    batch_number VARCHAR,
    expiry_date DATE,
    warehouse_id INTEGER REFERENCES public.warehouses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Returns
CREATE TABLE IF NOT EXISTS public.customer_returns (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    status return_status DEFAULT 'requested',
    reason return_reason NOT NULL,
    images JSONB,
    videos JSONB,
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customer Return Items
CREATE TABLE IF NOT EXISTS public.customer_return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL REFERENCES public.customer_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition item_condition,
    inspection_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier Returns
CREATE TABLE IF NOT EXISTS public.supplier_returns (
    id SERIAL PRIMARY KEY,
    po_id INTEGER REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    supplier_id INTEGER NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    reason return_reason,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier Return Items
CREATE TABLE IF NOT EXISTS public.supplier_return_items (
    id SERIAL PRIMARY KEY,
    supplier_return_id INTEGER NOT NULL REFERENCES public.supplier_returns(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason return_reason,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_warehouse_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_return_items ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Admins only for ERP features, Users can view their returns)
CREATE POLICY "Admins can do all on warehouses" ON public.warehouses FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));
CREATE POLICY "Everyone can view warehouses" ON public.warehouses FOR SELECT USING (true);

CREATE POLICY "Admins can do all on product_warehouse_stock" ON public.product_warehouse_stock FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));
CREATE POLICY "Everyone can view product_warehouse_stock" ON public.product_warehouse_stock FOR SELECT USING (true);

CREATE POLICY "Admins can do all on stock_history" ON public.stock_history FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

CREATE POLICY "Admins can do all on suppliers" ON public.suppliers FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

CREATE POLICY "Admins can do all on purchase_orders" ON public.purchase_orders FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));
CREATE POLICY "Admins can do all on purchase_order_items" ON public.purchase_order_items FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

CREATE POLICY "Users can manage own returns" ON public.customer_returns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all returns" ON public.customer_returns FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

CREATE POLICY "Users can view own return items" ON public.customer_return_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.customer_returns WHERE id = customer_return_items.return_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own return items" ON public.customer_return_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.customer_returns WHERE id = customer_return_items.return_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all return items" ON public.customer_return_items FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

CREATE POLICY "Admins can do all on supplier_returns" ON public.supplier_returns FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));
CREATE POLICY "Admins can do all on supplier_return_items" ON public.supplier_return_items FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

-- 5. Helper Functions & Triggers for Automation

-- Function: Automatically create stock record when a product is created
CREATE OR REPLACE FUNCTION public.fn_initialize_stock()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.product_warehouse_stock (product_id, warehouse_id, available_stock)
    SELECT NEW.product_id, id, NEW.stock FROM public.warehouses LIMIT 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_initialize_stock
AFTER INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.fn_initialize_stock();
