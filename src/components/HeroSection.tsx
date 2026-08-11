import { getHomepageSettings } from "@/services/homepage";
import { HeroSectionClient } from "./HeroSectionClient";

export async function HeroSection() {
  const defaultSlides = [
    {
      badge: "✨ HERITAGE",
      heading: "Freedom Shirt Co.",
      highlight: "Premium Tailoring.",
      sub: "A legacy of style. We bring you the finest collection of handcrafted shirts, designed to make you feel free and confident.",
      cta: "Discover More",
      ctaHref: "#products",
      secondary: "Our Story",
      secondaryHref: "#products",
      discount: "PREMIUM QUALITY",
      bg: "from-amber-100/50 to-yellow-100/50 dark:from-amber-950/30 dark:to-yellow-950/30",
      bgImage: "", // No background image for this one, so the watermark logo shines
      accent: "bg-amber-200/80 dark:bg-amber-800/30",
      accentText: "text-amber-800 dark:text-amber-300",
    },
    {
      badge: "✂️ NEW COLLECTION",
      heading: "Crafted for",
      highlight: "The Modern Man.",
      sub: "Premium shirts tailored with precision. Experience the art of fine stitching and luxurious fabrics.",
      cta: "Shop Shirts",
      ctaHref: "#products",
      secondary: "Our Craftsmanship",
      secondaryHref: "#products",
      discount: "FLAT 30% OFF",
      bg: "from-amber-50/50 to-yellow-50/30 dark:from-amber-950/20 dark:to-yellow-950/10",
      bgImage: "url('/images/hero_formal_shirt.png')",
      accent: "bg-amber-100/80 dark:bg-amber-900/30",
      accentText: "text-amber-700 dark:text-amber-400",
    },
    {
      badge: "🧵 HANDCRAFTED",
      heading: "Classic Formals,",
      highlight: "Timeless Elegance.",
      sub: "From boardroom to celebrations — our formal shirts are designed for every occasion that matters.",
      cta: "Shop Formals",
      ctaHref: "#products",
      secondary: "View All",
      secondaryHref: "#products",
      discount: "UP TO 40% OFF",
      bg: "from-stone-50/50 to-amber-50/30 dark:from-stone-950/20 dark:to-amber-950/10",
      bgImage: "url('/images/hero_casual_shirt.png')",
      accent: "bg-stone-100/80 dark:bg-stone-900/30",
      accentText: "text-stone-700 dark:text-stone-400",
    },
  ];

  let slides = defaultSlides;
  try {
    const data = await getHomepageSettings("hero_section");
    if (data && Array.isArray(data)) {
      slides = data;
    }
  } catch (error) {
    console.error("Failed to fetch hero section slides", error);
  }

  return <HeroSectionClient initialSlides={slides} />;
}
