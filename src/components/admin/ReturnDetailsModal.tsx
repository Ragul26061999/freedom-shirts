"use client";

import { useState } from "react";
import { ReturnRequestType, ReturnStatus } from "@/types";
import { useUpdateReturnStatus } from "@/hooks/queries/use-returns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Calendar,
  IndianRupee,
  Truck,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

interface ReturnDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnReq: ReturnRequestType | null;
  onUpdated?: () => void;
}

const statusOptions: { value: ReturnStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending Review", color: "bg-amber-100 text-amber-800" },
  { value: "approved", label: "Approved (Pickup Pending)", color: "bg-blue-100 text-blue-800" },
  { value: "pickup_scheduled", label: "Pickup Scheduled / In Transit", color: "bg-purple-100 text-purple-800" },
  { value: "received", label: "Item Received", color: "bg-indigo-100 text-indigo-800" },
  { value: "completed", label: "Refund Completed / Closed", color: "bg-green-100 text-green-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
];

export function ReturnDetailsModal({
  isOpen,
  onClose,
  returnReq,
  onUpdated,
}: ReturnDetailsModalProps) {
  const updateStatusMutation = useUpdateReturnStatus();

  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus>(returnReq?.status || "pending");
  const [adminNotes, setAdminNotes] = useState(returnReq?.admin_notes || "");
  const [shouldRestock, setShouldRestock] = useState(false);

  if (!returnReq) return null;

  const handleUpdateStatus = async (newStatus: ReturnStatus, autoRestock?: boolean) => {
    try {
      await updateStatusMutation.mutateAsync({
        returnId: returnReq.id,
        status: newStatus,
        adminNotes: adminNotes.trim() || undefined,
        shouldRestock: autoRestock !== undefined ? autoRestock : shouldRestock,
      });

      toast.success(`Return status updated to "${newStatus.replace("_", " ")}"`);
      onUpdated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to update return status");
    }
  };

  const deliveryDate = returnReq.delivered_at ? new Date(returnReq.delivered_at) : null;
  const returnDate = returnReq.created_at ? new Date(returnReq.created_at) : new Date();
  
  // Calculate days between delivery and return request
  const daysDifference = deliveryDate 
    ? Math.floor((returnDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  Return Request #{returnReq.id}
                </DialogTitle>
                <DialogDescription>
                  For Order #{returnReq.order_id}
                </DialogDescription>
              </div>
            </div>
            <Badge className="w-fit text-xs font-semibold uppercase tracking-wider">
              {returnReq.status.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-3 text-sm">
          {/* Customer & Timeline Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                Customer Information
              </span>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {returnReq.profile?.username || "Customer"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Email: {returnReq.profile?.email || returnReq.user_id}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
                7-Day Policy Verification
              </span>
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  Delivered on:{" "}
                  <strong>{deliveryDate ? format(deliveryDate, "MMM dd, yyyy") : "N/A"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Return Requested on:{" "}
                  <strong>{format(returnDate, "MMM dd, yyyy")}</strong>
                </span>
              </div>
              <div className="pt-1">
                {daysDifference <= 7 ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Valid Policy Claim ({daysDifference} days after delivery)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Claimed after {daysDifference} days
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Returned Items */}
          <div>
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block mb-2">
              Product(s) Claimed for Return
            </span>
            <div className="border rounded-xl divide-y bg-background">
              {returnReq.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-lg object-cover border"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                        {item.selectedColor ? `Color: ${item.selectedColor} • ` : ""}
                        Qty to return: <strong>{item.quantity}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      ({formatCurrency(item.price)} each)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Return Reason & Customer's Detailed Explanation */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
              Customer Reason & Detailed Complaint
            </span>
            <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div>
                  <span className="text-xs text-muted-foreground">Category: </span>
                  <Badge variant="outline" className="capitalize font-semibold">
                    {returnReq.reason_category.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Requested Resolution: </span>
                  <span className="text-xs font-bold text-primary capitalize">
                    {returnReq.preferred_resolution.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Customer Explanation:</p>
                <p className="text-sm bg-background p-3 rounded-lg border leading-relaxed text-foreground whitespace-pre-wrap font-mono">
                  &quot;{returnReq.detailed_reason}&quot;
                </p>
              </div>

              {/* Uploaded Proof Images */}
              {returnReq.proof_images && returnReq.proof_images.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Attached Proof Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {returnReq.proof_images.map((img, i) => (
                      <a
                        key={i}
                        href={img}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative h-16 w-16 rounded-lg border overflow-hidden bg-background hover:ring-2 hover:ring-primary transition-all"
                      >
                        <Image src={img} alt="Proof" width={64} height={64} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="h-4 w-4 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Refund Value & Restock Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium block">
                Total Refundable Value
              </span>
              <span className="text-xl font-extrabold tracking-tight">
                {formatCurrency(returnReq.refund_amount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs">Inventory Restocked:</span>
              <Badge className={returnReq.restocked ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}>
                {returnReq.restocked ? "Restocked" : "Not Restocked Yet"}
              </Badge>
            </div>
          </div>

          {/* Admin Decision Actions */}
          <div className="space-y-3 pt-2 border-t">
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider block">
              Admin Processing & Response
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Update Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) => setSelectedStatus(val as ReturnStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Restock on save</Label>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="restock"
                    checked={shouldRestock || !!returnReq.restocked}
                    disabled={!!returnReq.restocked}
                    onCheckedChange={(checked) => setShouldRestock(!!checked)}
                  />
                  <label htmlFor="restock" className="text-xs text-muted-foreground cursor-pointer">
                    {returnReq.restocked ? "Items already restocked" : "Auto-increment product stock on receive"}
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Internal Admin Notes / Customer Message</Label>
              <Textarea
                placeholder="Add notes for the customer or internal records (e.g. Return approved, pickup arranged via BlueDart on Monday)..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="min-h-[70px] text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-wrap sm:flex-nowrap gap-2 justify-between items-center border-t pt-3">
          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {returnReq.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs"
                  onClick={() => handleUpdateStatus("approved")}
                  disabled={updateStatusMutation.isPending}
                >
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Approve Return
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs font-semibold"
                  onClick={() => handleUpdateStatus("rejected")}
                  disabled={updateStatusMutation.isPending}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject Claim
                </Button>
              </>
            )}

            {returnReq.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                onClick={() => handleUpdateStatus("pickup_scheduled")}
                disabled={updateStatusMutation.isPending}
              >
                <Truck className="mr-1 h-3.5 w-3.5" />
                Schedule Pickup
              </Button>
            )}

            {(returnReq.status === "approved" || returnReq.status === "pickup_scheduled") && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
                onClick={() => handleUpdateStatus("received", true)}
                disabled={updateStatusMutation.isPending}
              >
                <Package className="mr-1 h-3.5 w-3.5" />
                Mark Received & Restock
              </Button>
            )}

            {returnReq.status === "received" && (
              <Button
                size="sm"
                variant="default"
                className="bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold"
                onClick={() => handleUpdateStatus("completed")}
                disabled={updateStatusMutation.isPending}
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Issue Refund / Complete
              </Button>
            )}
          </div>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateStatus(selectedStatus)}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
