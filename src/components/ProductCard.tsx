"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductType } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { Star, Heart, ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";

interface ProductCardProps {
  product: ProductType;
  hideAddToCart?: boolean;
  layout?: "vertical" | "horizontal";
}

export function ProductCard({ product, hideAddToCart = false, layout = "vertical" }: ProductCardProps) {
  const { addToCart, cartItems, updateQuantity, removeFromCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const isWishlisted = isInWishlist(product.product_id);
  const [isHovered, setIsHovered] = useState(false);

  // Stable rating per product
  const ratingRef = useRef(+(4.2 + (product.product_id.charCodeAt(0) % 10) / 13).toFixed(1));
  const reviewRef = useRef(50 + (product.product_id.charCodeAt(0) % 10) * 20);
  const rating = ratingRef.current;
  const reviewCount = reviewRef.current;

  const isOnSale =
    !!product.discount_price &&
    product.discount_price > 0 &&
    product.discount_price <= 100;
  const currentPrice = isOnSale
    ? product.price - product.price * (product.discount_price! / 100)
    : product.price;
  const originalPrice = isOnSale ? product.price : null;
  const discountPercentage = isOnSale ? product.discount_price : 0;

  const cartItem = cartItems.find((item) => item.product_id === product.product_id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.product_id);
  };

  return (
    <Card
      className={`group relative flex ${layout === "horizontal" ? "flex-row h-auto items-center p-3 gap-4" : "flex-col"} overflow-hidden border border-border/50 bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer rounded-2xl`}
      onClick={() => router.push(`/products/${product.product_id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className={`relative ${layout === "horizontal" ? "w-[90px] h-[90px] shrink-0 rounded-xl" : "w-full aspect-square rounded-t-2xl"} bg-muted/30 overflow-hidden`}>
        {/* Sale badge */}
        {isOnSale && layout !== "horizontal" && (
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-destructive text-destructive-foreground rounded-full px-2.5 py-1 text-[11px] font-bold shadow">
            <Zap className="h-3 w-3" />
            {discountPercentage}% OFF
          </div>
        )}

        {/* Stock warning */}
        {product.stock > 0 && product.stock <= 5 && layout !== "horizontal" && (
          <div className="absolute top-3 right-12 z-20 bg-amber-500 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
            Only {product.stock} left!
          </div>
        )}

        {/* Wishlist */}
        {layout !== "horizontal" && (
          <button
            onClick={handleWishlist}
            className={`absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
              isWishlisted
                ? "bg-destructive text-white scale-110"
                : "bg-white/80 text-muted-foreground hover:bg-white hover:text-destructive"
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        )}

        {/* Product image */}
        {product.image ? (
          <Image
            src={product.image}
            alt={product.title}
            width={400}
            height={400}
            className={`h-full w-full object-contain p-4 transition-transform duration-500 ${isHovered ? "scale-110" : "scale-100"}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}


      </div>

      {/* Info */}
      <div className={`flex flex-col flex-1 ${layout === "horizontal" ? "py-1 pr-2 gap-0.5 justify-center" : "p-4 gap-1.5 justify-center overflow-hidden"}`}>
        {/* Stars */}
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30 fill-muted"}`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{rating} ({reviewCount})</span>
        </div>

        {/* Title */}
        <h3 className={`font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug ${layout === "horizontal" ? "text-sm" : "text-sm sm:text-base"}`}>
          {product.title}
        </h3>

        {/* Price */}
        <div className={`flex items-baseline gap-2 pt-1 ${layout === "horizontal" ? "" : "mt-auto"}`}>
          <span className={`${layout === "horizontal" ? "text-base" : "text-lg"} font-bold text-foreground`}>₹{currentPrice.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-xs text-muted-foreground line-through">₹{originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Add to Cart Button (always visible at bottom unless hidden) */}
        {!hideAddToCart && (
          <div onClick={(e) => e.stopPropagation()}>
            {quantityInCart > 0 ? (
              <div className="flex items-center justify-between border border-primary/30 rounded-lg px-3 py-1.5 bg-primary/5">
                <button
                  className="text-primary hover:text-primary/70 transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quantityInCart === 1) removeFromCart(product.product_id);
                    else updateQuantity(product.product_id, -1);
                  }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold text-sm text-foreground">{quantityInCart} in cart</span>
                <button
                  className="text-primary hover:text-primary/70 transition-colors p-1 disabled:opacity-50"
                  disabled={quantityInCart >= product.stock}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product.product_id, 1);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Button
                className="w-full rounded-lg gap-2 text-sm font-medium bg-black text-white hover:bg-blue-600 hover:text-white transition-colors"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
