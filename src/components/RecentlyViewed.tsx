"use client";

import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function RecentlyViewed() {
  const { recentProducts } = useRecentlyViewed();

  if (!recentProducts || recentProducts.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 pb-16 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-foreground">Recently Viewed</h2>
          <p className="text-muted-foreground text-sm mt-1">Pick up right where you left off</p>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
        >
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Grid container to show max 3 items side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentProducts.slice(0, 3).map((product) => (
          <div key={product.product_id} className="w-full">
            <ProductCard product={product} hideAddToCart={true} layout="horizontal" />
          </div>
        ))}
      </div>
    </section>
  );
}
