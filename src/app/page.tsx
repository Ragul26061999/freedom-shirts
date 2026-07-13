import { Suspense } from "react";
import ClientProducts from "@/components/ClientProducts";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { HeroSection } from "@/components/HeroSection";
import { CategoryBar } from "@/components/CategoryBar";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Innova e-Commerce – Discover Your Style",
  description: "Premium quality fashion for modern lifestyles. Shop women, men, kids, shoes, bags, accessories and more.",
};

export default function Home() {
  return (
    <ErrorBoundary>
      <div className="bg-background min-h-screen">
        {/* Hero */}
        <HeroSection />

        {/* Category Icon Bar */}
        <CategoryBar />

        {/* Promotional Banners */}
        <section className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Banner 1 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/20 p-6 flex flex-col justify-between min-h-[180px] border border-rose-100 dark:border-rose-900/30 hover:shadow-lg transition-shadow">
              <div>
                <p className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">Women's Wear</p>
                <h3 className="text-2xl font-extrabold text-foreground leading-tight">Summer<br />Collection 2024</h3>
                <p className="text-muted-foreground text-sm mt-2">Fresh styles for every moment.</p>
              </div>
              <Link
                href="/women"
                className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:gap-2 transition-all mt-4"
              >
                Shop Women <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="absolute right-4 bottom-4 text-6xl opacity-20">👗</div>
            </div>

            {/* Banner 2 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/20 p-6 flex flex-col justify-between min-h-[180px] border border-sky-100 dark:border-sky-900/30 hover:shadow-lg transition-shadow">
              <div>
                <p className="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">Men's Essentials</p>
                <h3 className="text-2xl font-extrabold text-foreground leading-tight">Timeless<br />Looks for Men</h3>
                <p className="text-muted-foreground text-sm mt-2">Timeless looks for every man.</p>
              </div>
              <Link
                href="/men"
                className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:gap-2 transition-all mt-4"
              >
                Shop Men <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="absolute right-4 bottom-4 text-6xl opacity-20">👔</div>
            </div>

            {/* Banner 3 */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 p-6 flex flex-col justify-between min-h-[180px] border border-amber-100 dark:border-amber-900/30 hover:shadow-lg transition-shadow">
              <div>
                <p className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">Big Sale</p>
                <h3 className="text-2xl font-extrabold text-foreground leading-tight">Up to 50%<br />Off Now</h3>
                <p className="text-muted-foreground text-sm mt-2">Don't miss out on exclusive deals!</p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:gap-2 transition-all mt-4"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="absolute right-4 bottom-4 text-6xl opacity-20">🛍️</div>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section id="products" className="container mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-foreground">Best Sellers</h2>
              <p className="text-muted-foreground text-sm mt-1">Our most loved products by customers</p>
            </div>
            <Link
              href="/"
              className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View All Products <ArrowRight className="h-4 w-4" />
            </Link>
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

        {/* Testimonials */}
        <section className="bg-card border-y border-border py-14">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-foreground">What Our Customers Say ✨</h2>
              <p className="text-muted-foreground text-sm mt-2">Real reviews from verified buyers</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: "Jessica M.", role: "Verified Buyer", text: "Amazing quality and fast delivery! Innova Fashion is my go-to store.", stars: 5 },
                { name: "David K.", role: "Verified Buyer", text: "Stylish collection and great customer service. Highly recommend!", stars: 5 },
                { name: "Sophia R.", role: "Verified Buyer", text: "Love the designs! The fabric quality is top-notch and super comfortable.", stars: 5 },
              ].map((review) => (
                <div
                  key={review.name}
                  className="bg-background rounded-2xl p-6 border border-border hover:border-primary/20 hover:shadow-md transition-all"
                >
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: review.stars }).map((_, i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </ErrorBoundary>
  );
}
