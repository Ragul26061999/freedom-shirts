"use client";

import { useWishlist } from "@/context/WishlistContext";
import { useProducts } from "@/hooks/queries";
import { ProductCard } from "@/components/ProductCard";
import { ErrorState } from "@/components/ErrorState";
import { HeartCrack } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { data: products, isLoading, error, refetch } = useProducts();

  const wishlistedProducts = products?.filter((product) => 
    wishlist.includes(product.product_id)
  ) || [];

  return (
    <div className="container mx-auto px-4 py-10 min-h-[70vh]">
      <h1 className="text-3xl font-extrabold mb-8 text-foreground">My Wishlist</h1>
      
      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2" />
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to load wishlist items"
          description="We couldn't load the products. Please try again."
          onRetry={refetch}
          error={error}
          type="network"
        />
      ) : wishlistedProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="bg-muted/50 rounded-full p-8 mb-6 border border-border">
            <HeartCrack className="h-12 w-12 text-muted-foreground/60" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-foreground">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
            Looks like you haven't added anything to your wishlist yet. Explore our products and find something you love!
          </p>
          <Link href="/">
            <Button size="lg" className="rounded-full px-8 shadow-md">
              Start Shopping
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {wishlistedProducts.map((product) => (
            <motion.div 
              key={product.product_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}