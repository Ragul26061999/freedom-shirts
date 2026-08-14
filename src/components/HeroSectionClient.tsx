"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateHomepageSettings } from "@/services/homepage";
import { toast } from "sonner";

export function HeroSectionClient({ initialSlides }: { initialSlides: any[] }) {
  const { user } = useAuth();
  const [slides, setSlides] = useState(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // Check if the current user is the admin
  const isAdmin = user?.email === 'innovacentra@gmail.com';

  useEffect(() => {
    if (isEditing) return; // Pause carousel while editing
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length, isEditing]);

  const slide = slides[currentSlide];

  const handleSave = async () => {
    try {
      const result = await updateHomepageSettings("hero_section", slides);
      if (result.success) {
        toast.success("Hero section updated successfully!");
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error("Failed to update hero section: " + error.message);
    }
  };

  const handleChange = (field: string, value: string) => {
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], [field]: value };
    setSlides(newSlides);
  };

  return (
    <section className="relative overflow-hidden transition-all duration-700 bg-gradient-to-br from-yellow-50 via-yellow-100/30 to-yellow-50">
      
      {/* Dynamic Background Image with Fade Mask */}
      {slide.bgImage && (
        <div 
          className="absolute inset-y-0 right-0 w-full md:w-3/4 lg:w-[60%] bg-cover bg-[center_15%] bg-no-repeat transition-all duration-700"
          style={{ 
            backgroundImage: slide.bgImage,
            maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 100%)'
          }}
        />
      )}

      {/* FSC Logo Background/Feature */}
      <div className={`absolute right-0 lg:right-[2%] top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ${!slide.bgImage ? 'opacity-100 scale-110 z-10 drop-shadow-2xl' : 'opacity-0 scale-95 z-0'}`}>
        <img src="/images/freedom%201.png" alt="" className="w-[300px] md:w-[450px] lg:w-[550px] h-auto" />
      </div>

      {/* Gradient overlay to ensure text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-100/95 via-yellow-50/80 to-transparent dark:from-background dark:via-background/90" />
      
      {isAdmin && (
        <div className="absolute bottom-6 right-6 z-50 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-1 text-sm bg-gray-200 text-gray-800 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1 text-sm bg-primary text-primary-foreground rounded-md"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 text-primary rounded-md backdrop-blur-sm"
            >
              <Edit className="w-4 h-4" /> Edit Hero
            </button>
          )}
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 pt-28 pb-10 md:pt-36 md:pb-16">
        {isEditing && (
          <div className="mb-4 p-4 bg-background/80 backdrop-blur rounded-xl border max-w-xl space-y-2">
            <h4 className="font-bold text-sm">Editing Slide {currentSlide + 1}</h4>
            <input type="text" value={slide.badge} onChange={(e) => handleChange("badge", e.target.value)} className="w-full text-xs p-1 rounded border bg-transparent" placeholder="Badge" />
            <input type="text" value={slide.heading} onChange={(e) => handleChange("heading", e.target.value)} className="w-full text-sm p-1 rounded border bg-transparent" placeholder="Heading" />
            <input type="text" value={slide.highlight} onChange={(e) => handleChange("highlight", e.target.value)} className="w-full text-sm p-1 rounded border bg-transparent" placeholder="Highlight" />
            <textarea value={slide.sub} onChange={(e) => handleChange("sub", e.target.value)} className="w-full text-sm p-1 rounded border bg-transparent" placeholder="Subtitle" rows={2} />
            <input type="text" value={slide.discount} onChange={(e) => handleChange("discount", e.target.value)} className="w-full text-sm p-1 rounded border bg-transparent" placeholder="Discount Text (e.g. UP TO 50% OFF)" />
            <input type="text" value={slide.bgImage} onChange={(e) => handleChange("bgImage", e.target.value)} className="w-full text-xs p-1 rounded border bg-transparent" placeholder="Background Image URL (e.g. url('/img.png'))" />
          </div>
        )}

        <div className="min-h-[400px] flex items-center">
          {/* Left Content */}
          <div className="space-y-5 z-10 max-w-xl">
            <div className={`inline-flex items-center gap-2 ${slide.accent} ${slide.accentText} rounded-full px-4 py-1.5 text-xs font-semibold`}>
              {slide.badge}
            </div>

            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                {slide.heading}
              </h1>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight bg-gradient-to-r from-primary via-yellow-600 to-primary bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-heading)' }}>
                {slide.highlight}
              </h1>
            </div>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
              {slide.sub}
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              {isEditing ? (
                <>
                  <input type="text" value={slide.cta} onChange={(e) => handleChange("cta", e.target.value)} className="p-2 border rounded bg-background" />
                  <input type="text" value={slide.secondary} onChange={(e) => handleChange("secondary", e.target.value)} className="p-2 border rounded bg-background" />
                </>
              ) : (
                <>
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
                </>
              )}
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
              {slide.discount.match(/\d+%/)?.[0] || slide.discount}
            </span>
            <span className="text-xs font-semibold opacity-80">OFF</span>
          </div>

          {/* Floating info pills */}
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-amber-100 text-xs font-medium text-foreground flex items-center gap-2">
            <span className="text-primary text-base">✂️</span> New Arrivals
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-amber-100 text-xs font-medium text-foreground flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" /> 500+ sold this week
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
