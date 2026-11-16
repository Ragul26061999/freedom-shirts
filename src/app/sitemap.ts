import type { MetadataRoute } from "next";
import { productServerService } from "@/services/product/productServerService";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/products`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/clothing`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/accessories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.4 },
  ];

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await productServerService.getProducts();
    const now = new Date();
    productRoutes = products
      .filter((product) => product.product_id)
      .map((product) => ({
        url: `${baseUrl}/products/${encodeURIComponent(String(product.product_id))}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (error) {
    console.error("Sitemap: could not load products", error);
  }

  return [...staticRoutes, ...productRoutes];
}
