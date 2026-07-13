"use client";

import { Filter, SortAsc } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterOptions, useCategories } from "@/hooks/queries";

interface ProductFilterProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const sortOptions = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
];

const stockOptions = [
  { value: "all", label: "All Products" },
  { value: "in-stock", label: "In Stock" },
  { value: "out-of-stock", label: "Out of Stock" },
];

const categoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "electronics", label: "Electronics" },
  { value: "clothing", label: "Clothing" },
  { value: "accessories", label: "Accessories" },
];

export function ProductFilter({ filters, onFilterChange }: ProductFilterProps) {
  const { data: categories } = useCategories();

  const handleSortChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      sortBy: value as FilterOptions["sortBy"],
    });
  };

  const handleStockChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      stockFilter: value as FilterOptions["stockFilter"],
    });
  };

  const handleCategoryChange = (value: string | null) => {
    if (value == null) return;
    onFilterChange({
      ...filters,
      categoryFilter: value as FilterOptions["categoryFilter"],
    });
  };

  const dynamicCategoryOptions = [
    { value: "all", label: "All Categories" },
    ...(categories || []).map((cat) => ({
      value: cat.name.toLowerCase(),
      label: cat.name,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 pt-2">
      <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-muted-foreground whitespace-nowrap mb-2">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>

      <div className="flex flex-1 items-end gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
        {/* Sort Options */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Sort By</label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px] h-9 bg-background/50 border-border/50 rounded-full text-xs">
              <SortAsc className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stock Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Availability</label>
          <Select value={filters.stockFilter} onValueChange={handleStockChange}>
            <SelectTrigger className="w-[130px] h-9 bg-background/50 border-border/50 rounded-full text-xs">
              <SelectValue placeholder="Stock status" />
            </SelectTrigger>
            <SelectContent>
              {stockOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-1">Category</label>
          <Select
            value={filters.categoryFilter}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[130px] h-9 bg-background/50 border-border/50 rounded-full text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {dynamicCategoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
