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
  delivered_at?: string;
  cancellation_reason?: string;
  order_items?: OrderItemType[];
  has_return?: boolean;
  return_status?: ReturnStatus;
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

// ----------------- Return Management Types ----------------- //

export type ReturnStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "pickup_scheduled"
  | "received"
  | "completed";

export type ReturnReasonCategory =
  | "size_issue"
  | "defective_damaged"
  | "wrong_item"
  | "quality_issue"
  | "not_as_described"
  | "other";

export interface ReturnItemType {
  product_id: string;
  title: string;
  image?: string;
  quantity: number;
  price: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ReturnRequestType {
  id: string;
  order_id: number;
  user_id: string;
  created_at: string;
  delivered_at: string;
  items: ReturnItemType[];
  reason_category: ReturnReasonCategory;
  detailed_reason: string;
  proof_images?: string[];
  preferred_resolution: "refund" | "replacement" | "store_credit";
  status: ReturnStatus;
  admin_notes?: string;
  restocked?: boolean;
  refund_amount: number;
  refund_status?: "pending" | "processed" | "failed";
  updated_at?: string;
  profile?: {
    username?: string;
    email?: string;
  };
  shipping_address?: AddressType;
}
