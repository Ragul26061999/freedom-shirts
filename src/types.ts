export interface ProductSizeVariant {
  size: string;
  stock: number;
}

export interface ProductColorVariant {
  color: string;
  images: string[];
  sizes: ProductSizeVariant[];
}

export interface ProductType {
  product_id: string;
  title: string;
  description: string;
  price: number;
  discount_price?: number;
  offer_start_date?: string;
  offer_end_date?: string;
  image?: string; // Kept for backwards compatibility / main thumbnail
  stock: number;
  sku?: string;
  category_id?: number;
  manufacturing_date?: string;
  expiry_date?: string;
  created_at?: string;
  updated_at?: string;
  variants?: ProductColorVariant[];
}

export interface CartItemType {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product?: ProductType;
  selectedColor?: string;
  selectedSize?: string;
}

export type CartStatus = "active" | "abandoned" | "converted";

export interface CartType {
  id: string;
  user_id: string;
  status: CartStatus;
  created_at: string;
  updated_at: string;
  total_items: number;
  total_price: number;
  cart_items?: CartItemType[];
}

export interface OrderItemType {
  id: number;
  order_id: number;
  quantity: number;
  price: number;
  product_id: string;
  selectedColor?: string;
  selectedSize?: string;
  product?: {
    product_id: string;
    title: string;
    image?: string;
  };
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderType {
  id: number;
  user_id: string;
  status: OrderStatus;
  total: number;
  shipping_address_id: number;
  payment_method?: string;
  payment_id?: string;
  created_at?: string;
  updated_at?: string;
  cancellation_reason?: string;
  order_items?: OrderItemType[];
}

export interface AddressType {
  id: number;
  user_id: string;
  street: string;
  city: string;
  state?: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

export interface ProfileType {
  profile_id: string;
  username?: string;
  avatar_url?: string;
  email?: string;
  role: "admin" | "user";
  created_at: string;
  updated_at?: string;
}

export interface ReviewType {
  id: number;
  product_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at?: string;
  profile?: ProfileType;
}

export interface CategoryType {
  id: number;
  name: string;
  description: string;
  parent_id?: number;
}

export interface ShippingRateType {
  id: number;
  state: string;
  district?: string;
  charge: number;
  created_at?: string;
}
