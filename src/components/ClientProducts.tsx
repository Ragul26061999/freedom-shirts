"use client";

import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, FilterOptions } from "@/hooks/queries";
import { ProductType } from "@/types";
import { ErrorState } from "@/components/ErrorState";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProductFilter } from "@/components/ProductFilter";
import { useState, useMemo } from "react";

// Helper functions (moved from hook to component for simplicity)
const getCategoryId = (categoryName: string): number | null => {
  const categoryMap: { [key: string]: number } = {
    electronics: 3,
    clothing: 1,
    accessories: 2,
  };
  return categoryMap[categoryName] || null;
};

// Sort products based on the selected option
const sortProducts = (
  products: ProductType[],
  sortBy: FilterOptions["sortBy"],
) => {
  const sorted = [...products];

  switch (sortBy) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
};

const filterProducts = (products: ProductType[], filters: FilterOptions) => {
  let filtered = [...products];

  // Filter by stock (only if not 'all')
  if (filters.stockFilter === "in-stock") {
    filtered = filtered.filter((product) => product.stock > 0);
  } else if (filters.stockFilter === "out-of-stock") {
    filtered = filtered.filter((product) => product.stock === 0);
  }
  // When stockFilter is 'all', show all products regardless of stock

  // Filter by category (only if not 'all')
  if (filters.categoryFilter !== "all") {
    const categoryId = getCategoryId(filters.categoryFilter);
    if (categoryId !== null) {
      filtered = filtered.filter(
        (product) => product.category_id === categoryId,
      );
    }
  }
  // When categoryFilter is 'all', show all categories

  return filtered;
};

export default function ClientProducts() {
  // const { user } = useAuth(); // user is not used in this component
  const {
    data: products = [],
    isLoading: loading,
    error,
    refetch: retry,
  } = useProducts();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: "default",
    stockFilter: "all",
    categoryFilter: "all",
  });

  // Process products with search, filters, and sorting
  //useMemo is used to memoize the function
  const processedProducts = useMemo(() => {
    if (!products) return [];

    // Start with all products
    let processed = [...products];

    // Apply search filter
    if (searchTerm.trim() !== "") {
      processed = processed.filter(
        (product) =>
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ),
      );
    }

    // Apply filters
    processed = filterProducts(processed, filters);

    // Apply sorting
    processed = sortProducts(processed, filters.sortBy);

    return processed;
  }, [products, searchTerm, filters]);

  return (
    <ErrorBoundary>
      <>
        {/* Search and Filters Container */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card rounded-xl border p-4 shadow-sm"
        >
          {/* Search Input */}
          <div className="w-full lg:max-w-sm relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <Input
              type="search"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 rounded-full bg-muted/50 border-border/50 focus:bg-background"
            />
          </div>

          {/* Product Filter */}
          <div className="w-full lg:w-auto">
            <ProductFilter filters={filters} onFilterChange={setFilters} />
          </div>
        </motion.div>

        {/* Product Count and Reset */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-muted/50 flex flex-col items-center justify-between gap-4 rounded-lg p-4 sm:flex-row"
        >
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span>
              Showing {processedProducts.length} of {products?.length || 0}{" "}
              products
            </span>
          </div>

          {/* Reset Filters Button */}
          {(filters.sortBy !== "default" ||
            filters.stockFilter !== "all" ||
            filters.categoryFilter !== "all" ||
            searchTerm.trim() !== "") && (
            <button
              onClick={() => {
                setFilters({
                  sortBy: "default",
                  stockFilter: "all",
                  categoryFilter: "all",
                });
                setSearchTerm("");
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-3 py-1 text-xs transition-colors"
            >
              Reset All Filters
            </button>
          )}
        </motion.div>

        {/* Products grid */}
        <div className="py-4">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex min-h-[200px] items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="border-primary h-8 w-8 rounded-full border-t-2 border-b-2"
                />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorState
                  title="Failed to load products"
                  description="We couldn't load the products. Please try again."
                  onRetry={retry}
                  error={error}
                  type="network"
                />
              </motion.div>
            ) : processedProducts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ErrorState
                  title={
                    (products?.length || 0) === 0
                      ? "No products available"
                      : "No products match your filters"
                  }
                  description={
                    (products?.length || 0) === 0
                      ? "No products are currently available. Please check back later."
                      : searchTerm.trim() !== ""
                        ? "Try a different search term or adjust your filters."
                        : "Try adjusting your filters to see more products."
                  }
                  showRetry={false}
                  type="not-found"
                />
                {(products?.length || 0) > 0 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => {
                        setFilters({
                          sortBy: "default",
                          stockFilter: "all",
                          categoryFilter: "all",
                        });
                        setSearchTerm("");
                      }}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="products"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatePresence>
                  {processedProducts.map((product, index) => (
                    <motion.div
                      key={product.product_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1,
                      }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </>
    </ErrorBoundary>
  );
}
