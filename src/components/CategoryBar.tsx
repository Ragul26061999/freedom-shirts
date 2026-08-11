"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useCategories } from "@/hooks/queries";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CategoryBar() {
  const { data: categories } = useCategories();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categoryItems = categories
    ? categories.map((cat) => ({
        name: cat.name,
        emoji: cat.description && cat.description.startsWith('http') ? null : "🛍️",
        image: cat.description && cat.description.startsWith('http') ? cat.description : null,
        href: `/?category=${cat.id}`,
      }))
    : [];

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [categoryItems.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 180;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-3 sm:py-4 relative z-10">
      <div className="container mx-auto px-2 sm:px-4 relative">

        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 sm:left-1 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur border border-gray-200 rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-white hover:text-primary transition-all flex items-center justify-center -ml-1 sm:-ml-3"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 sm:right-1 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur border border-gray-200 rounded-full p-1.5 sm:p-2 shadow-lg hover:bg-white hover:text-primary transition-all flex items-center justify-center -mr-1 sm:-mr-3"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex items-center justify-start gap-3 sm:gap-5 md:gap-6 overflow-x-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 pt-2 px-1 sm:px-2 scroll-smooth"
        >


          {categoryItems.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              scroll={false}
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center gap-2 sm:gap-3 flex-shrink-0"
            >
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-xl bg-white border-2 transition-all duration-300 overflow-hidden flex items-center justify-center text-2xl shadow-sm relative ${
                  activeCategory === cat.name
                    ? "border-primary shadow-xl shadow-primary/10 -translate-y-2"
                    : "border-amber-100/80 active:border-primary/50 active:shadow-xl active:shadow-primary/10 active:-translate-y-2"
                }`}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      activeCategory === cat.name ? "scale-110" : ""
                    }`}
                  />
                ) : (
                  <span className={`transition-transform duration-300 z-10 ${
                    activeCategory === cat.name ? "scale-110" : ""
                  }`}>{cat.emoji}</span>
                )}
                {/* Subtle gradient overlay on active */}
                <div className={`absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent transition-opacity duration-300 pointer-events-none ${
                  activeCategory === cat.name ? "opacity-100" : "opacity-0"
                }`} />
              </div>
              <span className={`text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                activeCategory === cat.name ? "text-primary" : "text-gray-800 dark:text-primary"
              }`}>
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
