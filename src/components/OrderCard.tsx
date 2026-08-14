import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItemType, OrderType } from "@/types";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCancelOrder } from "@/hooks/queries/use-orders";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RotateCcw, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { returnService } from "@/services/return/returnService";
import { ReturnRequestModal } from "@/components/returns/ReturnRequestModal";

interface OrderCardProps {
  order: OrderType;
  onUpdate?: (updatedOrder: OrderType) => void;
}

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const { user } = useAuth();
  const cancelOrder = useCancelOrder();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  const eligibility = returnService.checkEligibility(order);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    
    if (!user?.id) {
      toast.error("You must be logged in to cancel an order");
      return;
    }

    try {
      await cancelOrder.mutateAsync({
        orderId: order.id.toString(),
        reason: cancelReason,
        userId: user.id,
      });
      toast.success("Order cancelled and items restocked");
      setIsCancelModalOpen(false);
      
      onUpdate?.({
        ...order,
        status: "cancelled",
        cancellation_reason: cancelReason
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    }
  };

  const getReturnBadge = () => {
    if (order.has_return || order.return_status) {
      const status = order.return_status || "pending";
      const colorMap: Record<string, string> = {
        pending: "bg-amber-100 text-amber-800 border-amber-200",
        approved: "bg-blue-100 text-blue-800 border-blue-200",
        pickup_scheduled: "bg-purple-100 text-purple-800 border-purple-200",
        received: "bg-indigo-100 text-indigo-800 border-indigo-200",
        completed: "bg-green-100 text-green-800 border-green-200",
        rejected: "bg-red-100 text-red-800 border-red-200",
      };
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${colorMap[status] || "bg-gray-100"}`}>
          <RotateCcw className="h-3 w-3" />
          Return: {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <Card className="overflow-hidden shadow-xs hover:shadow-md transition-shadow">
        <CardHeader className="bg-muted/20 pb-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold">Order #{order.id}</CardTitle>
                {getReturnBadge()}
              </div>
              <span className="text-muted-foreground text-xs">
                Placed on:{" "}
                {order.created_at
                  ? format(
                      typeof order.created_at === 'object' && 'toDate' in (order.created_at as any)
                        ? (order.created_at as any).toDate()
                        : (typeof order.created_at === 'object' && 'seconds' in (order.created_at as any)
                            ? new Date((order.created_at as any).seconds * 1000)
                            : new Date(order.created_at)),
                      "MMM dd, yyyy"
                    )
                  : "N/A"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "shipped"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "processing"
                        ? "bg-orange-100 text-orange-800"
                        : order.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>

              {/* Cancel Button for unfulfilled orders */}
              {order.status !== "cancelled" && order.status !== "delivered" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs cursor-pointer"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel Order
                </Button>
              )}

              {/* 7-Day Return Button for delivered orders */}
              {order.status === "delivered" && !order.has_return && !order.return_status && (
                eligibility.isEligible ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-medium border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 cursor-pointer"
                    onClick={() => setIsReturnModalOpen(true)}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" />
                    Return Items ({eligibility.daysRemaining}d left)
                  </Button>
                ) : (
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    Return Window Closed
                  </span>
                )
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {order.order_items?.map((item: OrderItemType) => (
              <div
                key={item.id}
                className="flex flex-col items-start justify-between border-b py-2 last:border-b-0 md:flex-row md:items-center"
              >
                <div className="flex items-center">
                  {item.product?.image ? (
                    <Image
                      src={item.product.image || ""}
                      alt={item.product.title}
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 rounded-lg object-cover border"
                    />
                  ) : (
                    <div className="mr-4 h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-xs">👕</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {item.product?.title || "Product"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                      {item.selectedColor ? `Color: ${item.selectedColor} • ` : ""}
                      Qty: {item.quantity} x ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-semibold text-sm md:mt-0">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              {order.status === "delivered" && eligibility.isEligible && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>7-day return policy valid till {eligibility.deadlineDate?.toLocaleDateString()}</span>
                </div>
              )}
              <div className="text-right ml-auto">
                <p className="text-muted-foreground text-xs">Total Amount</p>
                <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
              </div>
            </div>
            
            {order.status === "cancelled" && order.cancellation_reason && (
              <div className="mt-4 bg-red-50 dark:bg-red-950/30 p-3 rounded-xl border border-red-200 dark:border-red-900 text-xs">
                <span className="font-semibold text-red-800 dark:text-red-300">Reason for cancellation: </span>
                <span className="text-red-700 dark:text-red-400">{order.cancellation_reason}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Please let us know why you are cancelling this order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Keep Order
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelOrder}
              disabled={cancelOrder.isPending || !cancelReason.trim()}
            >
              {cancelOrder.isPending ? "Cancelling..." : "Submit & Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Request Modal */}
      {isReturnModalOpen && (
        <ReturnRequestModal
          isOpen={isReturnModalOpen}
          onClose={() => setIsReturnModalOpen(false)}
          order={order}
          onSuccess={() => {
            onUpdate?.({
              ...order,
              has_return: true,
              return_status: "pending"
            });
          }}
        />
      )}
    </>
  );
}
