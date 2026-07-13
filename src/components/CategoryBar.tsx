"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/queries";
import { ShoppingBag } from "lucide-react";

const defaultCategories = [
  { name: "Women", emoji: "👗", image: null, href: "/women" },
  { name: "Men", emoji: "👔", image: null, href: "/men" },
  { name: "Kids", emoji: "🧒", image: null, href: "/kids" },
  { name: "Shoes", emoji: "👟", image: null, href: "/shoes" },
  { name: "Bags", emoji: "👜", image: null, href: "/bags" },
  { name: "Watches", emoji: "⌚", image: null, href: "/watches" },
  { name: "Sunglasses", emoji: "🕶️", image: null, href: "/sunglasses" },
  { name: "Jewelry", emoji: "💍", image: null, href: "/jewelry" },
  { name: "Accessories", emoji: "🎩", image: null, href: "/accessories" },
  { name: "Sale", emoji: "🏷️", image: null, href: "/sale" },
];

export function CategoryBar() {
  const { data: categories } = useCategories();

  const categoryItems = categories && categories.length > 0
    ? categories.map((cat) => ({
        name: cat.name,
        emoji: cat.description && cat.description.startsWith('http') ? null : "🛍️",
        image: cat.description && cat.description.startsWith('http') ? cat.description : null,
        href: `/${cat.name.toLowerCase()}`,
      }))
    : defaultCategories;

  return (
    <section className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-start gap-6 overflow-x-auto scrollbar-hide pb-1">
          <Link
            href="/"
            className="flex flex-col items-center gap-2 group flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-muted border-2 border-transparent group-hover:border-primary transition-colors flex items-center justify-center text-2xl shadow-sm">
              <ShoppingBag className="h-7 w-7 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap">
              All
            </span>
          </Link>

          {categoryItems.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="flex flex-col items-center gap-2 group flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-muted border-2 border-transparent group-hover:border-primary transition-all overflow-hidden flex items-center justify-center text-2xl shadow-sm">
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{cat.emoji}</span>
                )}
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
