"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Sparkles, Layers, Tag } from "lucide-react";

export function DealsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const banners = [
    {
      id: 1,
      tag: "Custom Apparel",
      title: "Customized Shirts, T-Shirts & Hoodies",
      description: "Tailored to your exact style and fit. Experience zero-gravity precision crafting.",
      image: "/images/banner_customised.png",
      link: "#products",
      badge: "3D Custom Tailoring",
      icon: Sparkles,
      buttonText: "Explore Collection",
    },
    {
      id: 2,
      tag: "Corporate & Teamwear",
      title: "Bulk Orders & Uniform Tailoring",
      description: "Premium wholesale apparel solutions for events, corporate clients & teams.",
      image: "/images/banner_bulk_orders.png",
      link: "/contact",
      badge: "Bulk Savings Available",
      icon: Layers,
      buttonText: "Request Bulk Quote",
    },
    {
      id: 3,
      tag: "Limited Time Offers",
      title: "Unbeatable Low Pricing & Value Deals",
      description: "Up to 70% Off luxury crafted shirts, graphic tees & heavy hoodies.",
      image: "/images/banner_low_pricing.png",
      link: "#products",
      badge: "Best Value Offers",
      icon: Tag,
      buttonText: "Shop Offers Today",
    },
  ];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // 5 seconds auto slide
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [handleNext, isPaused]);

  const activeBanner = banners[currentIndex];

  return (
    <section className="w-full pt-4 pb-6">
      <div 
        className="relative w-full overflow-hidden bg-[#0f1016] shadow-2xl group transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Aspect Ratio Box: Responsive Widescreen Rectangular Banner */}
        <div className="relative w-full h-[220px] sm:h-[300px] md:h-[400px] lg:h-[480px] select-none">
          <AnimatePresence>
            <motion.div
              key={activeBanner.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
            >
              {/* Banner Background Image (Clickable) */}
              <Link href={activeBanner.link} className="absolute inset-0 block w-full h-full">
                <Image
                  src={activeBanner.image}
                  alt={activeBanner.title}
                  fill
                  priority
                  className="object-cover object-center w-full h-full"
                />
              </Link>


            </motion.div>
          </AnimatePresence>

          {/* Left / Right Arrow Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-primary hover:text-black text-white border border-white/20 backdrop-blur-md opacity-80 hover:opacity-100 transition-all duration-300 shadow-lg cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-primary hover:text-black text-white border border-white/20 backdrop-blur-md opacity-80 hover:opacity-100 transition-all duration-300 shadow-lg cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Bottom Indicators & Progress bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                onClick={() => setCurrentIndex(index)}
                className={`relative h-2 rounded-full transition-all duration-300 cursor-pointer overflow-hidden ${
                  currentIndex === index ? "w-8 bg-primary/40" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              >
                {currentIndex === index && (
                  <motion.div
                    key={isPaused ? "paused" : "running"}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute top-0 left-0 h-full bg-amber-400 rounded-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
