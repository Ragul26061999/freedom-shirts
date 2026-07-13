-- Supabase Database Schema Setup for E-commerce App

-- 1. Custom Types
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    profile_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT NOT NULL,
    parent_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
    product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price > 0),
    discount_price NUMERIC CHECK (discount_price >= 0),
    offer_start_date TIMESTAMPTZ,
    offer_end_date TIMESTAMPTZ,
    image VARCHAR,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    street VARCHAR NOT NULL,
    city VARCHAR NOT NULL,
    state VARCHAR,
    zip_code VARCHAR NOT NULL,
    country VARCHAR NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Carts table
CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cart Items table
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    status order_status DEFAULT 'pending',
    total NUMERIC NOT NULL CHECK (total >= 0),
    shipping_address_id INTEGER REFERENCES public.addresses(id) ON DELETE SET NULL,
    payment_method VARCHAR,
    payment_id VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipping Rates table
CREATE TABLE IF NOT EXISTS public.shipping_rates (
    id SERIAL PRIMARY KEY,
    state VARCHAR NOT NULL,
    district VARCHAR, -- null means applies to entire state
    charge NUMERIC NOT NULL DEFAULT 0 CHECK (charge >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Profiles
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Admin Users
CREATE POLICY "Admins can view admin users" ON public.admin_users FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Only existing admins can insert new admins" ON public.admin_users FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profile_id = auth.uid())
);

-- Categories
CREATE POLICY "Everyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can modify categories" ON public.categories FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

-- Products
CREATE POLICY "Everyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can modify products" ON public.products FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

-- Addresses
CREATE POLICY "Users can manage their own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);

-- Carts
CREATE POLICY "Users can manage their own carts" ON public.carts FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert into carts" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Cart Items
CREATE POLICY "Users can manage their own cart items" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND (user_id = auth.uid() OR user_id IS NULL))
);
CREATE POLICY "Users can insert into cart items" ON public.cart_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.carts WHERE id = cart_items.cart_id AND (user_id = auth.uid() OR user_id IS NULL))
);

-- Orders
CREATE POLICY "Users can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (auth.uid() IN (SELECT profile_id FROM admin_users));

-- Order Items
CREATE POLICY "Users can view their own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert order items for their own orders" ON public.order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- Reviews
CREATE POLICY "Everyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reviews" ON public.reviews FOR ALL USING (auth.uid() = user_id);

-- Shipping Rates
CREATE POLICY "Everyone can view shipping rates" ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY "Admins can modify shipping rates" ON public.shipping_rates FOR ALL USING (auth.uid() IN (SELECT profile_id FROM admin_users));

-- 5. Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);

-- 6. Storage Setup
-- Create a storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow anyone to view images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
