"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Share2, Minus, Plus, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, Check } from "lucide-react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react"; 
import { ReviewTab } from "./_components/review-tab";
import { ProductCard } from "@/components/ProductCard";

type ProductDetailsClientProps = {
  product: ProductType;
  relatedProducts?: ProductType[];
};

export default function ProductDetailsClient({
  product,
  relatedProducts,
}: ProductDetailsClientProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.product_id);
  const { addProduct } = useRecentlyViewed();

  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Variant States
  const hasVariants = product.variants && product.variants.length > 0;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number | null>(hasVariants ? 0 : null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      addProduct(product);
    }
  }, [product, addProduct]);

  // When variant changes, reset selected size and selected image index
  useEffect(() => {
    setSelectedSize(null);
    setSelectedImageIndex(0);
  }, [selectedVariantIndex]);

  const currentVariant = selectedVariantIndex !== null && product.variants ? product.variants[selectedVariantIndex] : null;
  
  // Determine images to show
  const productImages = useMemo(() => {
    if (currentVariant && currentVariant.images && currentVariant.images.length > 0) {
      return currentVariant.images;
    }
    return product.image ? [product.image] : ["/placeholder-product.jpg"];
  }, [currentVariant, product.image]);

  const isOnSale = !!product.discount_price && product.discount_price > 0 && product.discount_price <= 100;
  const currentPrice = isOnSale ? product.price - (product.price * (product.discount_price! / 100)) : product.price;
  const originalPrice = isOnSale ? product.price : null;
  const discountPercentage = isOnSale ? product.discount_price : 0;

  // Validation before adding to cart
  const canAddToCart = () => {
    if (product.stock === 0) return false;
    if (hasVariants) {
      return selectedVariantIndex !== null && selectedSize !== null;
    }
    return true;
  };

  const handleAddToCart = async () => {
    try {
      // Create a cloned product with selected variant details appended (to be handled by cart context)
      const productToAdd = { 
        ...product, 
        selectedColor: currentVariant?.color, 
        selectedSize: selectedSize || undefined 
      };

      for (let i = 0; i < quantity; i++) {
        // NOTE: we will need to update CartContext to properly store these selections
        addToCart(productToAdd as any); 
      }
      setIsAddedToCart(true);
      setTimeout(() => setIsAddedToCart(false), 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Product Images */}
          <div className="space-y-4 lg:col-span-5">
            <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
              <AnimatePresence mode="wait">
                <motion.div
                  key={productImages[selectedImageIndex]} // Re-animate when image changes
                  className="relative h-full w-full"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Image
                    src={productImages[selectedImageIndex]}
                    alt={product.title}
                    fill
                    className="object-contain p-4"
                    loading="eager"
                  />
                </motion.div>
              </AnimatePresence>

              {productImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/80 absolute top-1/2 left-4 -translate-y-1/2 backdrop-blur-sm cursor-pointer"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="bg-background/80 absolute top-1/2 right-4 -translate-y-1/2 backdrop-blur-sm cursor-pointer"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80 cursor-pointer backdrop-blur-sm"
                  onClick={() => toggleWishlist(product.product_id)}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-background/80 cursor-pointer backdrop-blur-sm"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {productImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((image, index) => (
                  <motion.button
                    key={index}
                    className={`aspect-square cursor-pointer overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6 lg:col-span-7">
            <div>
              <motion.h1
                className="text-foreground mb-2 text-3xl font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {product.title}
              </motion.h1>

              <motion.div
                className="mb-6 flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-end gap-3">
                  <span className="text-foreground text-3xl font-bold">
                    ₹{currentPrice.toFixed(2)}
                  </span>
                  {originalPrice && (
                    <span className="text-muted-foreground text-xl line-through mb-1">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                  )}
                  {isOnSale && (
                    <Badge variant="destructive" className="mb-1 text-sm">
                      {discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
                {product.stock > 0 ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    In Stock ({product.stock} available)
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </motion.div>
            </div>

            {/* Color Variants */}
            {hasVariants && (
              <motion.div
                className="space-y-4 pt-4 border-t"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-lg">Color</h3>
                    {currentVariant && (
                      <span className="text-sm text-muted-foreground">{currentVariant.color}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.variants!.map((variant, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all cursor-pointer
                          ${selectedVariantIndex === idx 
                            ? "border-primary bg-primary text-primary-foreground" 
                            : "border-border hover:border-primary/50 text-foreground bg-background"
                          }
                        `}
                      >
                        {variant.color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Variants (Dependent on selected Color) */}
                {currentVariant && currentVariant.sizes.length > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-lg">Size</h3>
                      {!selectedSize && (
                        <span className="text-sm text-rose-500 font-medium">Please select a size</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {currentVariant.sizes.map((size, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[3rem] h-12 px-4 rounded-md text-sm font-semibold border-2 transition-all cursor-pointer flex items-center justify-center
                            ${selectedSize === size 
                              ? "border-primary bg-primary text-primary-foreground" 
                              : "border-border hover:border-primary/50 text-foreground bg-background"
                            }
                          `}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Quantity and Add to Cart */}
            <motion.div
              className={`space-y-4 ${hasVariants ? 'pt-4 border-t' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div>
                <h3 className="mb-3 font-medium">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="border-border flex items-center rounded-lg border">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="cursor-pointer"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="min-w-[60px] px-4 py-2 text-center">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {product.stock} items available
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className={`w-full cursor-pointer ${!canAddToCart() ? 'opacity-50' : ''}`}
                disabled={!canAddToCart()}
                onClick={handleAddToCart}
              >
                {isAddedToCart ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {!canAddToCart() && hasVariants 
                      ? "Select Color and Size" 
                      : `Add to Cart - ₹${(currentPrice * quantity).toFixed(2)}`
                    }
                  </>
                )}
              </Button>
            </motion.div>

            {/* Shipping Info */}
            <motion.div
              className="border-border grid grid-cols-1 gap-4 border-t pt-6 sm:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <Truck className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-muted-foreground text-xs">Orders over ₹500</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-muted-foreground text-xs">SSL encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCcw className="text-primary h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">30-Day Returns</p>
                  <p className="text-muted-foreground text-xs">No questions asked</p>
                </div>
              </div>
            </motion.div>

            {/* Product Description */}
            <motion.div
              className="border-border pt-6 border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
                {product.sku && (
                  <div className="border-border mt-4 border-t pt-4">
                    <p className="text-muted-foreground text-sm">
                      <strong>SKU:</strong> {product.sku}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="border-border mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold">Reviews</h2>
          </div>
          <ReviewTab product={product} />
        </motion.div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold">You might also like</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.product_id}
                  product={relatedProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
