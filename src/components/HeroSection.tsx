"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const slides = [
  {
    badge: "✨ NEW ARRIVALS",
    heading: "Discover Your",
    highlight: "Style. Live Bold.",
    sub: "Premium quality fashion for modern lifestyles. Shop the latest trends.",
    cta: "Shop Now",
    ctaHref: "/",
    secondary: "Explore Collection",
    secondaryHref: "/",
    discount: "UP TO 50% OFF",
    bg: "from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20",
    bgImage: "url('/images/hero-fashion.png')",
    accent: "bg-rose-100 dark:bg-rose-900/30",
    accentText: "text-rose-600 dark:text-rose-400",
  },
  {
    badge: "🔥 HOT DEALS",
    heading: "Summer",
    highlight: "Collection 2024",
    sub: "Fresh styles for every moment. Limited time offers on select items.",
    cta: "Shop Summer",
    ctaHref: "/",
    secondary: "View All",
    secondaryHref: "/",
    discount: "UP TO 40% OFF",
    bg: "from-sky-50 to-indigo-50 dark:from-sky-950/20 dark:to-indigo-950/20",
    bgImage: "url('/images/hero-summer.png')",
    accent: "bg-sky-100 dark:bg-sky-900/30",
    accentText: "text-sky-600 dark:text-sky-400",
  },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section 
      className="relative overflow-hidden transition-all duration-700 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: slide.bgImage }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent dark:from-background dark:via-background/90" />
      <div className="container relative z-10 mx-auto px-4 py-10 md:py-16">
        <div className="min-h-[400px] flex items-center">
          {/* Left Content */}
          <div className="space-y-5 z-10 max-w-xl">
            <div className={`inline-flex items-center gap-2 ${slide.accent} ${slide.accentText} rounded-full px-4 py-1.5 text-xs font-semibold`}>
              {slide.badge}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
                {slide.heading}
              </h1>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight">
                {slide.highlight}
              </h1>
            </div>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
              {slide.sub}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link href={slide.ctaHref}>
                <Button size="lg" className="gap-2 rounded-full px-7 shadow-lg hover:shadow-primary/30 transition-all">
                  <ShoppingBag className="h-4 w-4" />
                  {slide.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={slide.secondaryHref}>
                <Button size="lg" variant="outline" className="rounded-full px-7 border-foreground/20 hover:bg-foreground/5">
                  {slide.secondary}
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-2">
                {["🧑", "👩", "👨", "👧", "🧓"].map((emoji, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs"
                  >
                    {emoji}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span>Trusted by <strong className="text-foreground">100K+</strong> happy customers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Offer Bar */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 flex-wrap">
          {/* Discount badge */}
          <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-full px-5 py-2.5 shadow-lg shadow-primary/30">
            <span className="text-xs font-semibold opacity-80">
              {slide.discount.split(" ").slice(0, 2).join(" ")}
            </span>
            <span className="text-2xl font-black">
              {slide.discount.match(/\d+%/)?.[0]}
            </span>
            <span className="text-xs font-semibold opacity-80">OFF</span>
          </div>

          {/* Floating info pills */}
          <div className="bg-card/90 backdrop-blur rounded-full px-4 py-2 shadow-md border text-xs font-medium text-foreground flex items-center gap-2">
            <span className="text-green-500 text-base">↑</span> New Arrivals
          </div>
          <div className="bg-card/90 backdrop-blur rounded-full px-4 py-2 shadow-md border text-xs font-medium text-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> 2K+ sold today
          </div>

          {/* Slide dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? "w-8 h-2 bg-primary"
                    : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
