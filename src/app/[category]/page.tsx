import { Suspense } from "react";
import CategoryPage from "@/components/CategoryPage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function DynamicCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.category);
  
  const supabase = await createServerSupabase();
  
  // Fetch category id based on name
  const { data: category } = await supabase
    .from('categories')
    .select('id, name')
    .ilike('name', categoryName)
    .single();

  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoryPage categoryName={category.name} categoryId={category.id} />
    </Suspense>
  );
}
