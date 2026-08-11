import { Suspense } from "react";
import CategoryPage from "@/components/CategoryPage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { db } from "@/lib/firebase/admin";
import { notFound } from "next/navigation";

export default async function DynamicCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const resolvedParams = await params;
  const categoryName = decodeURIComponent(resolvedParams.category);
  
  // Fetch category id based on name
  const categoriesRef = db.collection('categories');
  const snapshot = await categoriesRef.where('name', '==', categoryName).limit(1).get();

  let category = null;
  if (!snapshot.empty) {
    category = { id: snapshot.docs[0].id, name: snapshot.docs[0].data().name };
  } else {
    // Try case-insensitive matching by ID
    const doc = await categoriesRef.doc(categoryName.toLowerCase()).get();
    if (doc.exists) {
      category = { id: doc.id, name: doc.data()?.name };
    }
  }

  if (!category) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoryPage categoryName={category.name} categoryId={category.id} />
    </Suspense>
  );
}
