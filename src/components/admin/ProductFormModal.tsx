"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  CreateProductData,
  ProductWithDetails,
  adminProductService,
} from "@/services/admin/adminProductService";
import { useCategories } from "@/hooks/queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  product?: ProductWithDetails | null;
  title: string;
}

interface FormData {
  title: string;
  description: string;
  price: string;
  discount_price: string;
  offer_end_date: string;
  image: string;
  stock: string;
  sku: string;
  category_id: string;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  title,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    price: "",
    discount_price: "",
    offer_end_date: "",
    image: "",
    stock: "",
    sku: "",
    category_id: "no-category",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Use the query hook to fetch categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories();

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        discount_price: product.discount_price?.toString() || "",
        offer_end_date: product.offer_end_date ? new Date(product.offer_end_date).toISOString().slice(0, 16) : "",
        image: product.image || "",
        stock: product.stock?.toString() || "",
        sku: product.sku || "",
        category_id: product.category_id?.toString() || "no-category",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        discount_price: "",
        offer_end_date: "",
        image: "",
        stock: "",
        sku: "",
        category_id: "no-category",
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = "Price must be a positive number";
      }
    }

    if (!formData.stock.trim()) {
      newErrors.stock = "Stock is required";
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) {
        newErrors.stock = "Stock must be a non-negative number";
      }
    }

    if (formData.discount_price.trim()) {
      const discountPercentage = parseFloat(formData.discount_price);
      if (isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
        newErrors.discount_price = "Discount percentage must be between 0 and 100";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount_price: formData.discount_price.trim() ? parseFloat(formData.discount_price) : null,
        offer_start_date: formData.offer_end_date ? new Date().toISOString() : null,
        offer_end_date: formData.offer_end_date ? new Date(formData.offer_end_date).toISOString() : null,
        image: formData.image.trim() || null,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || null,
        category_id:
          formData.category_id && formData.category_id !== "no-category"
            ? parseInt(formData.category_id)
            : null,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategoryLoading(true);
      const newCategory = await adminProductService.createCategory({ 
        name: newCategoryName.trim(),
        description: newCategoryImage.trim() || undefined
      });
      toast.success("Category created successfully");
      await refetchCategories();
      setFormData(prev => ({ ...prev, category_id: newCategory.id.toString() }));
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setNewCategoryImage("");
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setCreatingCategoryLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await adminProductService.uploadProductImage(file);
      if (publicUrl) {
        handleInputChange("image", publicUrl);
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Failed to upload image. Please enter a URL instead.");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategoryImage(true);
    try {
      const publicUrl = await adminProductService.uploadProductImage(file);
      if (publicUrl) {
        setNewCategoryImage(publicUrl);
        toast.success("Category image uploaded successfully");
      } else {
        toast.error("Failed to upload category image. Please enter a URL instead.");
      }
    } catch (error) {
      toast.error("Error uploading category image");
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {product ? "Edit product details" : "Create a new product"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter product title"
                  className={
                    errors.title
                      ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                      : ""
                  }
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-rose-600">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter product description"
                  rows={3}
                  className={`w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none ${
                    errors.description
                      ? "border-rose-500 focus:ring-rose-500"
                      : "border-slate-300 focus:ring-blue-500"
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-rose-600">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className={
                      errors.price
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-rose-600">{errors.price}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    placeholder="0"
                    className={
                      errors.stock
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-rose-600">{errors.stock}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_price">Discount Percentage (%)</Label>
                  <Input
                    id="discount_price"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_price}
                    onChange={(e) => handleInputChange("discount_price", e.target.value)}
                    placeholder="e.g. 10"
                    className={
                      errors.discount_price
                        ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500"
                        : ""
                    }
                  />
                  {errors.discount_price && (
                    <p className="mt-1 text-sm text-rose-600">{errors.discount_price}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="offer_end_date">Offer Expiry Date</Label>
                  <Input
                    id="offer_end_date"
                    type="datetime-local"
                    value={formData.offer_end_date}
                    onChange={(e) => handleInputChange("offer_end_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => handleInputChange("sku", e.target.value)}
                  placeholder="Product SKU (optional)"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="category">Category</Label>
                  {!isCreatingCategory && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs px-2 cursor-pointer"
                      onClick={() => setIsCreatingCategory(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add New
                    </Button>
                  )}
                </div>
                
                {categoriesError && (
                  <div className="border-destructive/30 bg-destructive/10 mt-1 mb-2 space-y-2 rounded-md border p-2 text-sm">
                    <p className="text-destructive">{categoriesError.message}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => void refetchCategories()}
                    >
                      Retry categories
                    </Button>
                  </div>
                )}

                {isCreatingCategory ? (
                  <div className="flex flex-col gap-2 mt-1 bg-muted/30 border rounded-md p-3">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      autoFocus
                    />
                    <div className="flex flex-col gap-1">
                      <Input
                        value={newCategoryImage}
                        onChange={(e) => setNewCategoryImage(e.target.value)}
                        placeholder="Image URL (optional, e.g. https://...)"
                        className="text-xs h-8"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">OR UPLOAD:</span>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleCategoryImageUpload}
                          disabled={uploadingCategoryImage}
                          className="text-xs h-8 cursor-pointer file:cursor-pointer"
                        />
                      </div>
                      {uploadingCategoryImage && <span className="text-[10px] text-primary">Uploading...</span>}
                    </div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName("");
                          setNewCategoryImage("");
                        }}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="default"
                        onClick={handleCreateCategory}
                        disabled={creatingCategoryLoading || !newCategoryName.trim()}
                        className="cursor-pointer"
                      >
                        {creatingCategoryLoading ? "Creating..." : "Create"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      handleInputChange("category_id", value ?? "")
                    }
                    disabled={categoriesLoading || !!categoriesError}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-category">No category</SelectItem>
                      {categories?.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Image</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="image"
                    value={formData.image}
                    onChange={(e) => handleInputChange("image", e.target.value)}
                    placeholder="https://example.com/image.jpg (Enter URL)"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-full text-center relative before:absolute before:left-0 before:top-1/2 before:w-[45%] before:border-t after:absolute after:right-0 after:top-1/2 after:w-[45%] after:border-t">OR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="cursor-pointer file:cursor-pointer"
                    />
                    {uploadingImage && <span className="text-sm text-muted-foreground whitespace-nowrap">Uploading...</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

        <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
