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
      value: cat.id.toString(),
      label: cat.name,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4 pt-1">
      <div className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-500 whitespace-nowrap mb-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
        <Filter className="h-4 w-4" />
        <span>Filters</span>
      </div>

      <div className="flex flex-1 items-end gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
        {/* Sort Options */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Sort By</label>
          <Select value={filters.sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px] h-12 bg-gray-50 border-gray-200 rounded-xl text-sm font-medium hover:bg-white hover:border-primary/30 transition-all text-gray-700 focus:ring-2 focus:ring-primary/20">
              <SortAsc className="mr-2 h-4 w-4 text-gray-400" />
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
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Availability</label>
          <Select value={filters.stockFilter} onValueChange={handleStockChange}>
            <SelectTrigger className="w-[140px] h-12 bg-gray-50 border-gray-200 rounded-xl text-sm font-medium hover:bg-white hover:border-primary/30 transition-all text-gray-700 focus:ring-2 focus:ring-primary/20">
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
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Category</label>
          <Select
            value={filters.categoryFilter}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger className="w-[140px] h-12 bg-gray-50 border-gray-200 rounded-xl text-sm font-medium hover:bg-white hover:border-primary/30 transition-all text-gray-700 focus:ring-2 focus:ring-primary/20">
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
