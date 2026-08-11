import { getHomepageSettings } from "@/services/homepage";
import PromoBannersClient from "./PromoBannersClient";

export async function PromoBanners() {
  const defaultBanners = [
    {
      id: 1,
      tag: "Formal Collection",
      title: "Crisp Formals\nFor Every Occasion",
      subtitle: "Boardroom-ready shirts crafted for confidence.",
      buttonText: "Shop Formals",
      buttonLink: "#products",
      icon: "👔",
      gradient: "from-stone-100 to-amber-50 dark:from-stone-950/30 dark:to-amber-950/20",
      tagColor: "text-stone-700 dark:text-stone-400",
      borderColor: "border-stone-200 dark:border-stone-800/30",
    },
    {
      id: 2,
      tag: "Casual Wear",
      title: "Weekend\nCasual Edit",
      subtitle: "Relaxed fits, bold patterns, effortless style.",
      buttonText: "Shop Casual",
      buttonLink: "#products",
      icon: "👕",
      gradient: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20",
      tagColor: "text-amber-700 dark:text-amber-400",
      borderColor: "border-amber-200 dark:border-amber-800/30",
    },
    {
      id: 3,
      tag: "Custom Tailoring",
      title: "Made to\nMeasure",
      subtitle: "Your perfect fit, stitched just for you.",
      buttonText: "Get Measured",
      buttonLink: "#products",
      icon: "✂️",
      gradient: "from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/20",
      tagColor: "text-yellow-700 dark:text-yellow-400",
      borderColor: "border-yellow-200 dark:border-yellow-800/30",
    },
  ];

  let banners = defaultBanners;
  try {
    const data = await getHomepageSettings("promo_banners");
    if (data && Array.isArray(data)) {
      banners = data;
    }
  } catch (error) {
    console.error("Failed to fetch promo banners", error);
  }

  return (
    <section className="container mx-auto px-4 py-10">
      <PromoBannersClient initialBanners={banners} />
    </section>
  );
}
