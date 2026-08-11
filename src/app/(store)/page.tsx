import { Suspense } from "react";
import ClientProducts from "@/components/ClientProducts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DealsSection } from "@/components/DealsSection";
import { CategoryBar } from "@/components/CategoryBar";
import { RecentlyViewed } from "@/components/RecentlyViewed";


export const metadata = {
  title: "FSC – Freedom Shirt Company | Premium Shirts & Tailoring",
  description: "Crafted with precision. Premium quality shirts, custom tailoring, and timeless fashion for the modern gentleman.",
};

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen">
        {/* Category Icon Bar */}
        <div className="pt-[84px] sm:pt-[100px]">
          <CategoryBar />
        </div>

        {/* Deals and Offers */}
        <DealsSection />


        {/* Our Collection */}
        <section id="products" className="container mx-auto px-4 pb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Our Collection</h2>
            <p className="text-muted-foreground text-sm mt-1">Handpicked shirts, crafted for perfection</p>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-3" />
          </div>
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
          

        </section>

        {/* Recently Viewed */}
        <RecentlyViewed />



      </div>
    </ErrorBoundary>
  );
}
