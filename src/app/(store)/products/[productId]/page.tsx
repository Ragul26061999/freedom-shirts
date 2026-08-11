import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";
import { productServerService } from "@/services/product/productServerService";
import { ProductType } from "@/types";

interface ProductDetailsPageProps {
  params: Promise<{
    productId: string;
  }>;
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

  return <ProductDetailsClient product={product} relatedProducts={relatedProducts} />;
}
