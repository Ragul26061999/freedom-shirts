import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductDetailsClient from "./ProductDetailsClient";
import { productServerService } from "@/services/product/productServerService";
import { ProductType } from "@/types";

interface ProductDetailsPageProps {
  params: Promise<{
    productId: string;
  }>;
}

function effectivePrice(product: ProductType): number {
  const discount = product.discount_price;
  const isOnSale =
    typeof discount === "number" && discount > 0 && discount <= 100;
  return isOnSale
    ? Math.round((product.price - product.price * (discount / 100)) * 100) / 100
    : product.price;
}

export async function generateMetadata({
  params,
}: ProductDetailsPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await productServerService.getProductById(productId);

  if (!product) {
    return { title: "Product not found" };
  }

  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.title} from FSC – Freedom Shirt Company.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: `/products/${productId}` },
    openGraph: {
      title: product.title,
      description,
      type: "website",
      url: `/products/${productId}`,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const resolvedParams = await params;
  const product = await productServerService.getProductById(
    resolvedParams.productId,
  );

  if (!product) {
    notFound();
  }

  let relatedProducts: ProductType[] = [];
  if (product.category_id) {
    const allCategoryProducts = await productServerService.getProductsByCategory(product.category_id);
    relatedProducts = allCategoryProducts
      .filter((p) => p.product_id !== product.product_id)
      .slice(0, 4);
  }

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.image ? [product.image] : undefined,
    sku: product.sku || product.product_id,
    brand: { "@type": "Brand", name: "FSC – Freedom Shirt Company" },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: effectivePrice(product).toFixed(2),
      availability:
        (product.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/products/${product.product_id}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailsClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
