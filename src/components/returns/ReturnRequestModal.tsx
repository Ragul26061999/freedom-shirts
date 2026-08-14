"use client";

import { useState } from "react";
import { OrderType, OrderItemType, ReturnReasonCategory } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useCreateReturn } from "@/hooks/queries/use-returns";
import { returnService } from "@/services/return/returnService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RotateCcw,
  Clock,
  AlertCircle,
  CheckCircle2,
  Package,
  IndianRupee,
  Upload,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { toast } from "sonner";
import Image from "next/image";

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderType;
  onSuccess?: () => void;
}

const REASON_OPTIONS: { value: ReturnReasonCategory; label: string; description: string }[] = [
  {
    value: "size_issue",
    label: "Size / Fit Issue",
    description: "Item is too small, too large, or doesn't fit properly",
  },
  {
    value: "defective_damaged",
    label: "Defective or Damaged",
    description: "Product has torn fabric, broken buttons, stains or flaws",
  },
  {
    value: "wrong_item",
    label: "Wrong Item Received",
    description: "Received a different color, size, or completely different shirt",
  },
  {
    value: "quality_issue",
    label: "Quality Not as Expected",
    description: "Fabric, stitching, or finish doesn't match standard",
  },
  {
    value: "not_as_described",
    label: "Item Differs from Description",
    description: "Color or appearance differs substantially from photos",
  },
  {
    value: "other",
    label: "Other Reason",
    description: "Other personal reasons for returning",
  },
];

export function ReturnRequestModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReturnRequestModalProps) {
  const { user } = useAuth();
  const createReturnMutation = useCreateReturn();

  const eligibility = returnService.checkEligibility(order);

  // Selected item IDs mapped to selected quantity
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>(() => {
    const initial: Record<string, { selected: boolean; quantity: number }> = {};
    (order.order_items || []).forEach((item) => {
      initial[item.product_id] = { selected: true, quantity: item.quantity || 1 };
    });
    return initial;
  });

  const [reasonCategory, setReasonCategory] = useState<ReturnReasonCategory>("size_issue");
  const [detailedReason, setDetailedReason] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [preferredResolution, setPreferredResolution] = useState<"refund" | "replacement" | "store_credit">("refund");

  const toggleItemSelection = (productId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        selected: !prev[productId]?.selected,
        quantity: prev[productId]?.quantity || 1,
      },
    }));
  };

  const updateItemQuantity = (productId: string, qty: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: {
        selected: prev[productId]?.selected ?? true,
        quantity: Math.max(1, qty),
      },
    }));
  };

  const handleAddProofImage = () => {
    if (proofImageUrl.trim()) {
      setProofImages((prev) => [...prev, proofImageUrl.trim()]);
      setProofImageUrl("");
    }
  };

  const handleRemoveProofImage = (index: number) => {
    setProofImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate return total
  const selectedReturnItems = (order.order_items || [])
    .filter((item) => selectedItems[item.product_id]?.selected)
    .map((item) => ({
      product_id: item.product_id,
      title: item.product?.title || "Product",
      image: item.product?.image,
      quantity: Math.min(item.quantity, selectedItems[item.product_id]?.quantity || 1),
      price: item.price,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }));

  const estimatedRefund = selectedReturnItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleSubmitReturn = async () => {
    if (!user) {
      toast.error("Please sign in to submit a return request");
      return;
    }

    if (selectedReturnItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    if (!detailedReason.trim() || detailedReason.trim().length < 10) {
      toast.error("Please enter a detailed explanation (minimum 10 characters)");
      return;
    }

    try {
      await createReturnMutation.mutateAsync({
        order,
        userId: user.id,
        items: selectedReturnItems,
        reasonCategory,
        detailedReason: detailedReason.trim(),
        proofImages,
        preferredResolution,
      });

      toast.success("Return request submitted successfully! Admin will review shortly.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Request Product Return</DialogTitle>
              <DialogDescription>
                Order #{order.id} • Purchased by {user?.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 7-Day Window Eligibility Status Banner */}
        <div className="rounded-xl border p-4 bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border-amber-500/20">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  7-Day Return Policy Window
                </p>
                <p className="text-xs text-muted-foreground">
                  {eligibility.isEligible ? (
                    <>
                      You have{" "}
                      <span className="font-bold text-amber-700 dark:text-amber-300">
                        {eligibility.daysRemaining} day{eligibility.daysRemaining > 1 ? "s" : ""}
                      </span>{" "}
                      remaining to return this order (Deadline:{" "}
                      {eligibility.deadlineDate?.toLocaleDateString()}).
                    </>
                  ) : (
                    eligibility.reason || "Return window has expired."
                  )}
                </p>
              </div>
            </div>
            {eligibility.isEligible && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 shrink-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Eligible
              </Badge>
            )}
          </div>
        </div>

        {!eligibility.isEligible ? (
          <div className="py-6 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-destructive">{eligibility.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">
              If you believe this is an error, please contact our customer support.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Step 1: Select Items to Return */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                1. Select Item(s) to Return
              </Label>
              <div className="space-y-2 border rounded-xl p-3 bg-muted/20">
                {order.order_items?.map((item: OrderItemType) => {
                  const isChecked = selectedItems[item.product_id]?.selected ?? true;
                  const qty = selectedItems[item.product_id]?.quantity ?? item.quantity;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                        isChecked ? "bg-background border-primary/40 shadow-xs" : "opacity-60 border-transparent bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleItemSelection(item.product_id)}
                          id={`item-${item.id}`}
                        />
                        {item.product?.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.title}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <label
                            htmlFor={`item-${item.id}`}
                            className="text-sm font-medium text-foreground cursor-pointer"
                          >
                            {item.product?.title || "Product"}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                            {item.selectedColor ? `Color: ${item.selectedColor} • ` : ""}
                            ₹{item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>

                      {isChecked && item.quantity > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Qty:</span>
                          <Select
                            value={qty.toString()}
                            onValueChange={(val) => updateItemQuantity(item.product_id, parseInt(val || "1"))}
                          >
                            <SelectTrigger className="w-16 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                                <SelectItem key={n} value={n.toString()}>
                                  {n}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Reason Category */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                2. Reason for Return <span className="text-destructive">*</span>
              </Label>
              <Select
                value={reasonCategory}
                onValueChange={(val) => setReasonCategory(val as ReturnReasonCategory)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select primary reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col text-left py-0.5">
                        <span className="font-medium text-sm">{opt.label}</span>
                        <span className="text-xs text-muted-foreground">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Step 3: Detailed Reason / Customer Explanation */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                3. Detailed Explanation <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Please describe exactly what is wrong or why you want to return this product (e.g. stitches coming off at collar, size fits loose, wrong color sent)..."
                value={detailedReason}
                onChange={(e) => setDetailedReason(e.target.value)}
                className="min-h-[110px] text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Minimum 10 characters required. The more details you provide, the faster admin can process your return.
              </p>
            </div>

            {/* Step 4: Photo / Proof URL (Optional) */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                4. Photos / Proof Link (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL (e.g. defect picture / tag photo)..."
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  className="text-sm"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddProofImage}>
                  <Upload className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>

              {proofImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {proofImages.map((url, i) => (
                    <div key={i} className="flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs border">
                      <span className="truncate max-w-[180px]">{url}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProofImage(i)}
                        className="text-destructive hover:font-bold ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 5: Preferred Resolution */}
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                5. Preferred Resolution
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "refund", label: "Refund to Payment" },
                  { key: "store_credit", label: "Store Credit" },
                  { key: "replacement", label: "Exchange / Replace" },
                ].map((res) => (
                  <button
                    key={res.key}
                    type="button"
                    onClick={() => setPreferredResolution(res.key as any)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                      preferredResolution === res.key
                        ? "bg-primary/10 border-primary text-primary font-semibold shadow-xs"
                        : "hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Refund Total */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Estimated Refund Amount:</span>
              </div>
              <span className="text-base font-bold">
                {formatCurrency(estimatedRefund)}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {eligibility.isEligible && (
            <Button
              onClick={handleSubmitReturn}
              disabled={createReturnMutation.isPending || selectedReturnItems.length === 0 || detailedReason.trim().length < 10}
              className="font-semibold"
            >
              {createReturnMutation.isPending ? "Submitting..." : "Submit Return Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
