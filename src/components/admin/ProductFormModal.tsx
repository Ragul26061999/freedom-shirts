"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, X } from "lucide-react";
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
import { ProductColorVariant } from "@/types";
import Image from "next/image";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  product?: ProductWithDetails | null;
  title: string;
}

interface FormColorVariant extends ProductColorVariant {
  pendingImages?: { file: File; previewUrl: string }[];
}

interface FormData {
  title: string;
  description: string;
  price: string;
  discount_price: string;
  offer_end_date: string;
  image: string; // Keep as main thumbnail
  pendingMainImage?: { file: File; previewUrl: string };
  stock: string;
  sku: string;
  category_id: string;
  manufacturing_date: string;
  expiry_date: string;
  variants: FormColorVariant[];
}

function VariantSizesInput({ 
  initialSizes, 
  onChange 
}: { 
  initialSizes: {size: string, stock: number}[], 
  onChange: (sizes: {size: string, stock: number}[]) => void 
}) {
  const [newSize, setNewSize] = useState("");

  const handleAddSize = (e?: React.KeyboardEvent) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    
    if (newSize.trim()) {
      onChange([...initialSizes, { size: newSize.trim(), stock: 0 }]);
      setNewSize("");
    }
  };

  const updateSizeStock = (index: number, stock: number) => {
    const updated = [...initialSizes];
    updated[index].stock = stock;
    onChange(updated);
  };

  const removeSize = (index: number) => {
    const updated = initialSizes.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input 
          placeholder="New size (e.g. XL)" 
          value={newSize}
          onChange={(e) => setNewSize(e.target.value)}
          onKeyDown={handleAddSize}
        />
        <Button type="button" onClick={() => handleAddSize()} variant="secondary">Add</Button>
      </div>
      
      {initialSizes.length > 0 && (
        <div className="mt-3 space-y-2">
          {initialSizes.map((sizeObj, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
              <span className="font-medium min-w-[3rem] text-sm">{sizeObj.size}</span>
              <Input
                type="number"
                min="0"
                placeholder="Stock"
                value={sizeObj.stock.toString()}
                onChange={(e) => updateSizeStock(idx, parseInt(e.target.value) || 0)}
                className="h-8"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                onClick={() => removeSize(idx)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    manufacturing_date: "",
    expiry_date: "",
    variants: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState("");
  const [pendingCategoryImage, setPendingCategoryImage] = useState<{file: File, previewUrl: string} | null>(null);
  const [creatingCategoryLoading, setCreatingCategoryLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    data: categories,
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
        manufacturing_date: product.manufacturing_date || "",
        expiry_date: product.expiry_date || "",
        variants: (product.variants || []).map(v => ({ ...v, pendingImages: [] })),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        price: "",
        discount_price: "",
        offer_end_date: "",
        image: "",
        pendingMainImage: undefined,
        stock: "",
        sku: "",
        category_id: "no-category",
        manufacturing_date: "",
        expiry_date: "",
        variants: [],
      });
    }
    setPendingCategoryImage(null);
    setErrors({});
  }, [product, isOpen]);

  // Auto-calculate global stock when variants change
  useEffect(() => {
    if (formData.variants && formData.variants.length > 0) {
      const totalStock = formData.variants.reduce((total, variant) => {
        return total + variant.sizes.reduce((sum, sizeObj) => sum + (sizeObj.stock || 0), 0);
      }, 0);
      setFormData((prev) => ({ ...prev, stock: totalStock.toString() }));
    }
  }, [formData.variants]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) newErrors.price = "Price must be positive";
    }

    if (!formData.stock.trim()) {
      newErrors.stock = "Stock is required";
    } else {
      const stock = parseInt(formData.stock);
      if (isNaN(stock) || stock < 0) newErrors.stock = "Stock must be non-negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setUploadingImage(true);
    toast.info("Uploading images and saving product...");
    
    try {
      // 1. Upload Main Image if pending
      let finalMainImage = formData.image;
      if (formData.pendingMainImage) {
        const url = await adminProductService.uploadProductImage(formData.pendingMainImage.file);
        if (url) finalMainImage = url;
      }

      // 2. Upload Variant Images if pending
      const finalVariants = await Promise.all(
        formData.variants.map(async (variant) => {
          const uploadedUrls = [...variant.images];
          if (variant.pendingImages && variant.pendingImages.length > 0) {
            for (const pending of variant.pendingImages) {
              const url = await adminProductService.uploadProductImage(pending.file);
              if (url) uploadedUrls.push(url);
            }
          }
          return {
            color: variant.color,
            sizes: variant.sizes,
            images: uploadedUrls,
          };
        })
      );

      const submitData: CreateProductData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discount_price: formData.discount_price.trim() ? parseFloat(formData.discount_price) : null,
        offer_start_date: formData.offer_end_date ? new Date().toISOString() : null,
        offer_end_date: formData.offer_end_date ? new Date(formData.offer_end_date).toISOString() : null,
        image: finalMainImage.trim() || null,
        stock: parseInt(formData.stock),
        sku: formData.sku.trim() || null,
        category_id:
          formData.category_id && formData.category_id !== "no-category"
            ? parseInt(formData.category_id)
            : null,
        manufacturing_date: formData.manufacturing_date || null,
        expiry_date: formData.expiry_date || null,
        variants: finalVariants,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting product:", error);
      console.error("Failed to save product.");
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // --- Variant Handlers ---
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { color: "", images: [], sizes: [], pendingImages: [] }],
    }));
  };

  const updateVariant = (index: number, field: keyof ProductColorVariant, value: any) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    handleInputChange("variants", updated);
  };

  const removeVariant = (index: number) => {
    const updated = formData.variants.filter((_, i) => i !== index);
    handleInputChange("variants", updated);
  };

  const handleVariantImagesUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = files.filter(f => {
      if (f.size > 20 * 1024 * 1024) {
        console.error(`${f.name} exceeds 20MB limit`);
        return false;
      }
      return true;
    });

    if (!validFiles.length) {
      e.target.value = '';
      return;
    }

    const newPending = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    const updated = [...formData.variants];
    const currentPending = updated[index].pendingImages || [];
    updated[index].pendingImages = [...currentPending, ...newPending];
    handleInputChange("variants", updated);
    
    // reset input
    e.target.value = '';
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number, isPending: boolean) => {
    const updated = [...formData.variants];
    if (isPending) {
      const pending = updated[variantIndex].pendingImages || [];
      const removed = pending[imageIndex];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      updated[variantIndex].pendingImages = pending.filter((_, i) => i !== imageIndex);
    } else {
      updated[variantIndex].images = updated[variantIndex].images.filter((_, i) => i !== imageIndex);
    }
    handleInputChange("variants", updated);
  };

  // ... (category handlers excluded for brevity, will restore them below)
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setCreatingCategoryLoading(true);
      toast.info("Creating category...");

      let finalCatImage = newCategoryImage.trim() || undefined;
      if (pendingCategoryImage) {
        const url = await adminProductService.uploadProductImage(pendingCategoryImage.file);
        if (url) finalCatImage = url;
      }

      const newCategory = await adminProductService.createCategory({ 
        name: newCategoryName.trim(),
        description: finalCatImage
      });
      toast.success("Category created successfully");
      await refetchCategories();
      setFormData(prev => ({ ...prev, category_id: newCategory.id.toString() }));
      setIsCreatingCategory(false);
      setNewCategoryName("");
      setNewCategoryImage("");
      setPendingCategoryImage(null);
    } catch (error) {
      console.error("Failed to create category");
    } finally {
      setCreatingCategoryLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
      console.error("Image must be less than 20MB");
      e.target.value = '';
      return;
    }

    if (formData.pendingMainImage) {
      URL.revokeObjectURL(formData.pendingMainImage.previewUrl);
    }

    setFormData(prev => ({
      ...prev,
      pendingMainImage: {
        file,
        previewUrl: URL.createObjectURL(file)
      }
    }));
  };

  const handleCategoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      console.error("Category image must be less than 20MB");
      e.target.value = '';
      return;
    }

    if (pendingCategoryImage) {
      URL.revokeObjectURL(pendingCategoryImage.previewUrl);
    }
    
    setPendingCategoryImage({
      file,
      previewUrl: URL.createObjectURL(file)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {product ? "Edit product details" : "Create a new product"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-6">
            {/* Left Column - Product Details & Basic Setup */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <Label>Product Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={errors.title ? "border-rose-500" : ""}
                />
              </div>

              <div>
                <Label>Description *</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  className={`w-full rounded-md border px-3 py-2 ${errors.description ? "border-rose-500" : "border-slate-300"}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    className={errors.price ? "border-rose-500" : ""}
                  />
                </div>
                <div>
                  <Label>Global Stock * {formData.variants.length > 0 && <span className="text-xs font-normal text-muted-foreground">(Auto-calculated)</span>}</Label>
                  <Input
                    type="number" min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    className={errors.stock ? "border-rose-500" : ""}
                    disabled={formData.variants.length > 0}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount (%)</Label>
                  <Input
                    type="number" step="0.01" min="0" max="100"
                    value={formData.discount_price}
                    onChange={(e) => handleInputChange("discount_price", e.target.value)}
                  />
                </div>
                <div>
                  <Label>SKU</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                  />
                </div>
              </div>
              {/* Media and Categories (Moved to Left Column) */}
              <div className="pt-4 border-t space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label>Category</Label>
                    {!isCreatingCategory && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => setIsCreatingCategory(true)}>
                        <Plus className="h-3 w-3 mr-1" /> Add New
                      </Button>
                    )}
                  </div>

                  {isCreatingCategory ? (
                    <div className="flex flex-col gap-2 mt-1 bg-muted/30 border rounded-md p-3">
                      <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New category name" />
                      
                      <div className="flex flex-col gap-1.5 mt-1">
                        <Label className="text-xs text-muted-foreground">Category Image (Optional)</Label>
                        {(newCategoryImage || pendingCategoryImage) && (
                          <div className="relative w-16 h-16 border rounded overflow-hidden mb-1">
                            <Image 
                              src={pendingCategoryImage ? pendingCategoryImage.previewUrl : newCategoryImage} 
                              alt="category preview" 
                              fill 
                              className="object-cover" 
                            />
                          </div>
                        )}
                        <Input value={newCategoryImage} onChange={(e) => setNewCategoryImage(e.target.value)} placeholder="Image URL or upload" className="h-8 text-xs" />
                        <Input type="file" accept="image/*" onChange={handleCategoryImageUpload} disabled={creatingCategoryLoading} className="h-8 text-xs file:text-xs" />
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button type="button" size="sm" className="flex-1" onClick={handleCreateCategory} disabled={creatingCategoryLoading || !newCategoryName.trim()}>
                          {creatingCategoryLoading ? "Creating..." : "Create"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => {
                          setIsCreatingCategory(false);
                          setNewCategoryName("");
                          setNewCategoryImage("");
                          setPendingCategoryImage(null);
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value ?? "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category">
                          {formData.category_id !== "no-category"
                            ? categories?.find(c => c.id.toString() === formData.category_id)?.name || "Select a category"
                            : "No category"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-category">No category</SelectItem>
                        {categories?.map((c) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label>Main Thumbnail Image</Label>
                  <div className="flex flex-col gap-2 mt-1">
                    {(formData.image || formData.pendingMainImage) && (
                      <div className="relative w-20 h-20 border rounded overflow-hidden">
                        <Image 
                          src={formData.pendingMainImage ? formData.pendingMainImage.previewUrl : formData.image} 
                          alt="main preview" 
                          fill 
                          className="object-cover" 
                        />
                      </div>
                    )}
                    <Input value={formData.image} onChange={(e) => handleInputChange("image", e.target.value)} placeholder="URL or upload below" />
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Color & Size Variants Section */}
            <div className="lg:col-span-7 flex flex-col h-full border-l pl-0 lg:pl-8">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">Color & Size Variants</Label>
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-4 w-4 mr-2" /> Add Variant
                </Button>
              </div>
            
            <div className="space-y-6">
              {formData.variants.map((variant, index) => (
                <div key={index} className="p-4 border rounded-lg bg-muted/20 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 text-destructive hover:bg-destructive/10"
                    onClick={() => removeVariant(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Color Name</Label>
                      <Input 
                        placeholder="e.g. Midnight Blue" 
                        value={variant.color}
                        onChange={(e) => updateVariant(index, "color", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Available Sizes & Stock</Label>
                      <VariantSizesInput 
                        initialSizes={variant.sizes} 
                        onChange={(sizes) => updateVariant(index, "sizes", sizes)} 
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                      <Label>Variant Images</Label>
                      <div className="flex flex-wrap gap-2 mt-2 mb-2">
                        {/* Existing Images */}
                        {variant.images.map((img, imgIdx) => (
                          <div key={`existing-${imgIdx}`} className="relative w-16 h-16 border rounded overflow-hidden">
                            <Image src={img} alt="variant image" fill className="object-cover" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl"
                              onClick={() => removeVariantImage(index, imgIdx, false)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {/* Pending Images */}
                        {variant.pendingImages?.map((pending, pendingIdx) => (
                          <div key={`pending-${pendingIdx}`} className="relative w-16 h-16 border-2 border-dashed border-primary/50 rounded overflow-hidden">
                            <Image src={pending.previewUrl} alt="pending variant image" fill className="object-cover" />
                            <button
                              type="button"
                              className="absolute top-0 right-0 bg-black/50 text-white p-0.5 rounded-bl"
                              onClick={() => removeVariantImage(index, pendingIdx, true)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleVariantImagesUpload(index, e)}
                        className="cursor-pointer file:cursor-pointer max-w-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Select multiple files to upload to Cloudinary (auto-resized to 800px WebP)
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.variants.length === 0 && (
                <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                  No variants added. Click "Add Variant" to set up colors and sizes.
                </div>
              )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
