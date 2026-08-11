"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Edit } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateHomepageSettings } from "@/services/homepage";
import { toast } from "sonner";

export default function PromoBannersClient({ initialBanners }: { initialBanners: any[] }) {
  const { user } = useAuth();
  const [banners, setBanners] = useState(initialBanners);
  const [isEditing, setIsEditing] = useState(false);
  
  // Only the specified user can edit
  const isAdmin = user?.email === 'innovacentra@gmail.com';

  const handleSave = async () => {
    try {
      const result = await updateHomepageSettings("promo_banners", banners);
      if (result.success) {
        toast.success("Banners updated successfully!");
        setIsEditing(false);
      }
    } catch (error: any) {
      toast.error("Failed to update banners: " + error.message);
    }
  };

  const handleChange = (index: number, field: string, value: string) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setBanners(newBanners);
  };

  return (
    <div className="relative">
      {isAdmin && (
        <div className="absolute -top-10 right-0 flex gap-2">
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
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary/10 text-primary rounded-md"
            >
              <Edit className="w-4 h-4" /> Edit Banners
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${banner.gradient} p-6 flex flex-col justify-between min-h-[180px] border ${banner.borderColor} hover:shadow-lg transition-shadow`}
          >
            <div>
              {isEditing ? (
                <input
                  type="text"
                  value={banner.tag}
                  onChange={(e) => handleChange(index, "tag", e.target.value)}
                  className="w-full bg-background/50 border border-border rounded px-2 py-1 mb-1 text-xs font-bold uppercase"
                />
              ) : (
                <p className={`${banner.tagColor} text-xs font-bold uppercase tracking-wider mb-1`}>
                  {banner.tag}
                </p>
              )}

              {isEditing ? (
                <textarea
                  value={banner.title}
                  onChange={(e) => handleChange(index, "title", e.target.value)}
                  className="w-full bg-background/50 border border-border rounded px-2 py-1 text-xl font-extrabold"
                  rows={2}
                />
              ) : (
                <h3 className="text-2xl font-extrabold text-foreground leading-tight whitespace-pre-line">
                  {banner.title}
                </h3>
              )}

              {isEditing ? (
                <input
                  type="text"
                  value={banner.subtitle}
                  onChange={(e) => handleChange(index, "subtitle", e.target.value)}
                  className="w-full bg-background/50 border border-border rounded px-2 py-1 mt-2 text-sm"
                />
              ) : (
                <p className="text-muted-foreground text-sm mt-2">{banner.subtitle}</p>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={banner.buttonText}
                  onChange={(e) => handleChange(index, "buttonText", e.target.value)}
                  className="w-1/2 bg-background/50 border border-border rounded px-2 py-1 text-sm"
                  placeholder="Button Text"
                />
                <input
                  type="text"
                  value={banner.buttonLink}
                  onChange={(e) => handleChange(index, "buttonLink", e.target.value)}
                  className="w-1/2 bg-background/50 border border-border rounded px-2 py-1 text-sm"
                  placeholder="Button Link"
                />
              </div>
            ) : (
              <Link
                href={banner.buttonLink}
                className={`inline-flex items-center gap-1 text-sm font-semibold ${banner.tagColor} hover:gap-2 transition-all mt-4`}
              >
                {banner.buttonText} <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {isEditing ? (
              <input
                type="text"
                value={banner.icon}
                onChange={(e) => handleChange(index, "icon", e.target.value)}
                className="absolute right-4 bottom-4 w-12 text-2xl bg-background/50 border border-border rounded text-center"
              />
            ) : (
              <div className="absolute right-4 bottom-4 text-6xl opacity-20">{banner.icon}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
