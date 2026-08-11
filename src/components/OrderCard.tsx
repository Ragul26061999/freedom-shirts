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

interface OrderCardProps {
  order: OrderType;
  onUpdate?: (updatedOrder: OrderType) => void;
}

export function OrderCard({ order, onUpdate }: OrderCardProps) {
  const { user } = useAuth();
  const cancelOrder = useCancelOrder();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

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
      
      // Update local state by calling onUpdate with the modified order
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/20">
          <div className="flex flex-col justify-between md:flex-row">
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <div className="mt-2 flex items-center space-x-4 md:mt-0">
              <span className="text-muted-foreground text-sm">
                {order.created_at
                  ? format(new Date(order.created_at), "MMM dd, yyyy")
                  : "N/A"}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
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
              {order.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="ml-2 cursor-pointer"
                  onClick={() => setIsCancelModalOpen(true)}
                >
                  Cancel Order
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.order_items?.map((item: OrderItemType) => (
              <div
                key={item.id}
                className="flex flex-col items-start justify-between border-b py-2 last:border-b-0 md:flex-row md:items-center"
              >
                <div className="flex items-center">
                  {item.product?.image && (
                    <Image
                      src={item.product.image || ""}
                      alt={item.product.title}
                      width={48}
                      height={48}
                      className="mr-4 h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">
                      {item.product?.title || "Product"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Qty: {item.quantity} x ₹{item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="mt-2 font-medium md:mt-0">
                  ₹{(item.quantity * item.price).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <div className="text-right">
                <p className="text-muted-foreground text-sm">Total</p>
                <p className="text-lg font-bold">₹{order.total.toFixed(2)}</p>
              </div>
            </div>
            
            {order.status === "cancelled" && order.cancellation_reason && (
              <div className="mt-4 bg-red-50 p-3 rounded-md border border-red-100 text-sm">
                <span className="font-semibold text-red-800">Reason for cancellation: </span>
                <span className="text-red-700">{order.cancellation_reason}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
