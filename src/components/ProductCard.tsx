"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductType } from "@/types";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Minus, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



  const isOnSale =
    !!product.discount_price &&
    product.discount_price > 0 &&
    product.discount_price <= 100;
  const basePrice = product.price || 0;
  const currentPrice = isOnSale
    ? basePrice - basePrice * (product.discount_price! / 100)
    : basePrice;
  const originalPrice = isOnSale ? basePrice : null;
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

  // Check if product is new (e.g. added in last 7 days)
  const isNew = product.created_at ? (new Date().getTime() - new Date(product.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

  // Get all images with their associated colors
  const imageList = useMemo(() => {
    const list: { url: string; color: string | null }[] = [];
    
    // Process variant images
    product.variants?.forEach(variant => {
      variant.images?.forEach(img => {
        if (img) {
          list.push({ url: img, color: variant.color });
        }
      });
    });

    // Add main product image if list is empty
    if (list.length === 0 && product.image) {
      list.push({ url: product.image, color: null });
    }

    return list;
  }, [product]);

  // Handle auto-looping images on hover
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovered && imageList.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imageList.length);
      }, 1100); // Change image every 1.1 seconds
    } else if (!isHovered) {
      setCurrentImageIndex(0); // Reset when not hovering
    }
    return () => clearInterval(interval);
  }, [isHovered, imageList.length]);

  const displayImage = imageList.length > 0 ? imageList[currentImageIndex]?.url : product.image;
  const activeColor = imageList[currentImageIndex]?.color;

  // Get all unique colors for swatches
  const colors = Array.from(new Set(product.variants?.map(v => v.color).filter(Boolean) || []));

  return (
    <Card
      className={`group relative flex ${layout === "horizontal" ? "flex-row h-auto items-center p-3 gap-4" : "flex-col p-0"} overflow-hidden bg-primary/5 border border-primary/20 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer rounded-xl`}
      onClick={() => router.push(`/products/${product.product_id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className={`relative ${layout === "horizontal" ? "w-[90px] h-[90px] shrink-0 rounded-lg" : "w-full aspect-[3/4] rounded-t-xl"} bg-primary/10 overflow-hidden`}>
        
        {/* Badges (Top Right like reference) */}
        {layout !== "horizontal" && (
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
            {isOnSale && (
              <div className="bg-yellow-400 text-black rounded-full px-2 py-0.5 text-[11px] font-bold shadow-sm">
                -{discountPercentage}%
              </div>
            )}
            {isNew && (
              <div className="bg-black text-white rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                NEW
              </div>
            )}
          </div>
        )}

        {/* Wishlist (Moved to Top Left to balance layout) */}
        {layout !== "horizontal" && (
          <button
            onClick={handleWishlist}
            className={`absolute top-3 left-3 z-20 flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-all duration-200 ${
              isWishlisted
                ? "bg-white text-destructive scale-110"
                : "bg-white/70 text-muted-foreground hover:bg-white hover:text-destructive"
            }`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        )}

        {/* Product image */}
        {displayImage ? (
          <Image
            src={displayImage}
            alt={product.title || 'Product Image'}
            width={400}
            height={533}
            className={`h-full w-full object-cover transition-transform duration-700 ${isHovered ? "scale-105" : "scale-100"}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className={`flex flex-col flex-1 ${layout === "horizontal" ? "py-1 pr-2 gap-0.5 justify-center" : "pt-4 pb-3 px-3 gap-1.5 justify-center text-center overflow-hidden"}`}>
        
        {/* Title */}
        <h3 className={`font-medium text-foreground line-clamp-2 transition-colors leading-snug ${layout === "horizontal" ? "text-sm text-left" : "text-base sm:text-lg"}`}>
          {product.title}
        </h3>
        
        {/* Colors Swatches */}
        {colors.length > 0 && layout !== "horizontal" && (
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {colors.map((color, idx) => (
              <div 
                key={idx} 
                className={`w-3.5 h-3.5 rounded-full border shadow-sm transition-all duration-300 ${activeColor === color ? "border-primary scale-125 ring-1 ring-primary/50" : "border-gray-300"}`}
                style={{ backgroundColor: color.toLowerCase() }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className={`flex items-center justify-center gap-2 pt-1 ${layout === "horizontal" ? "justify-start" : ""}`}>
          {originalPrice && (
            <span className="text-[13px] sm:text-sm text-muted-foreground line-through">₹{originalPrice.toFixed(2)}</span>
          )}
          <span className={`${layout === "horizontal" ? "text-base" : "text-[17px] sm:text-[19px]"} font-bold ${isOnSale ? 'text-red-600' : 'text-foreground'}`}>
            ₹{currentPrice.toFixed(2)}
          </span>
        </div>

        {/* Divider line before Add to Cart */}
        {!hideAddToCart && layout !== "horizontal" && (
          <hr className="border-border w-3/4 mx-auto mt-3 mb-1" />
        )}

        {/* Add to Cart Button */}
        {!hideAddToCart && (
          <div onClick={(e) => e.stopPropagation()} className="mt-auto pt-1">
            {quantityInCart > 0 ? (
              <div className="flex items-center justify-between border border-border rounded-md px-3 py-1.5 bg-muted/30 max-w-[200px] mx-auto">
                <button
                  className="text-foreground hover:text-primary transition-colors p-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quantityInCart === 1) removeFromCart(product.product_id);
                    else updateQuantity(product.product_id, -1);
                  }}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-semibold text-sm text-foreground">{quantityInCart}</span>
                <button
                  className="text-foreground hover:text-primary transition-colors p-1 disabled:opacity-50"
                  disabled={quantityInCart >= product.stock}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product.product_id, 1);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full gap-2 text-sm font-bold tracking-wide uppercase hover:bg-transparent hover:text-primary text-foreground transition-colors h-auto py-2"
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

