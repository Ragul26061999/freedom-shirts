import { Suspense } from "react";
import ClientProducts from "@/components/ClientProducts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Products",
  description: "Browse all our amazing products.",
};

export default function ProductsPage() {
  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">All Products</h1>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-card border border-border animate-pulse">
                    <div className="aspect-square bg-muted rounded-t-2xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-3 bg-muted rounded w-2/3" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <ClientProducts />
          </Suspense>
        </div>
      </div>
    </ErrorBoundary>
  );
}
