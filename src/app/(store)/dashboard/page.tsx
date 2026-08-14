"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProducts, useOrders, useProfile, useUserReturns } from "@/hooks/queries";
import Link from "next/link";
import { OrderCard } from "@/components/OrderCard";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { ErrorState } from "@/components/ErrorState";
import Image from "next/image";
import { RotateCcw, Clock, AlertCircle, CheckCircle2, Package, IndianRupee } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "analytics" | "products" | "orders" | "returns"
  >("analytics");

  // Use query hooks instead of manual state management
  const {
    data: products,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useProducts();
  const { data: orders, isLoading: ordersLoading } = useOrders(user?.id || "");
  const { data: userReturns, isLoading: returnsLoading } = useUserReturns(user?.id || "");
  const { data: profile } = useProfile(user?.id || "");
  const isAdmin = profile?.role === "admin";

  if (!user) {
    return (
      <div className="container mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You need to be signed in to view your dashboard.
            </p>
            <Link href="/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getReturnStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Approved (Pickup Pending)</Badge>;
      case "pickup_scheduled":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pickup Scheduled</Badge>;
      case "received":
        return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Item Received</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Refund Completed</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Return Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-1">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`hover:text-primary cursor-pointer px-4 py-2 font-medium transition-colors ${
              activeTab === "analytics"
                ? "border-primary text-primary border-b-2 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Analytics
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab("products")}
              className={`hover:text-primary cursor-pointer px-4 py-2 font-medium transition-colors ${
                activeTab === "products"
                  ? "border-primary text-primary border-b-2 font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              Products
            </button>
          )}
          <button
            onClick={() => setActiveTab("orders")}
            className={`hover:text-primary cursor-pointer px-4 py-2 font-medium transition-colors ${
              activeTab === "orders"
                ? "border-primary text-primary border-b-2 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            Order History
          </button>
          <button
            onClick={() => setActiveTab("returns")}
            className={`hover:text-primary cursor-pointer px-4 py-2 font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "returns"
                ? "border-primary text-primary border-b-2 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Returns & Refunds
            {userReturns && userReturns.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
                {userReturns.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "analytics" &&
          (ordersLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <DashboardCharts orders={orders || []} />
          ))}

        {activeTab === "products" &&
          (productsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : productsError ? (
            <ErrorState
              title="Failed to load products"
              description="We could not load products for the dashboard. Check your connection."
              onRetry={refetchProducts}
              error={productsError}
              type="network"
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products && products.length > 0 ? (
                products.map((product) => (
                  <Card key={product.product_id} className="overflow-hidden">
                    <div className="h-48 bg-gray-100">
                      {product.image ? (
                        <Image
                          src={product.image || ""}
                          alt={product.title}
                          width={400}
                          height={192}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                          No image
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-1">
                        {product.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                        {product.description}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          ₹{(product.price || 0).toFixed(2)}
                        </span>
                        <Link href={`/products/${product.product_id}`}>
                          <Button size="sm">View Details</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full flex h-64 items-center justify-center">
                  <p className="text-muted-foreground">No products found</p>
                </div>
              )}
            </div>
          ))}

        {activeTab === "orders" &&
          (ordersLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center px-4 py-12">
                  <p className="mb-4 text-xl font-medium">No orders yet</p>
                  <p className="text-muted-foreground mb-6">
                    You haven&apos;t placed any orders yet.
                  </p>
                  <Link href="/">
                    <Button>Browse Products</Button>
                  </Link>
                </div>
              )}
            </div>
          ))}

        {activeTab === "returns" &&
          (returnsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <p>Loading return requests...</p>
            </div>
          ) : userReturns && userReturns.length > 0 ? (
            <div className="space-y-4">
              {userReturns.map((ret) => (
                <Card key={ret.id} className="overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                  <CardHeader className="bg-muted/20 pb-3">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold">Return Request #{ret.id}</CardTitle>
                          <span className="text-xs text-muted-foreground">for Order #{ret.order_id}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          Requested on {format(new Date(ret.created_at), "MMM dd, yyyy • hh:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getReturnStatusBadge(ret.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Items being returned */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Items to return:</p>
                      {ret.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-b-0 text-sm">
                          <div className="flex items-center gap-3">
                            {item.image ? (
                              <Image src={item.image} alt={item.title} width={36} height={36} className="h-9 w-9 rounded-md object-cover border" />
                            ) : (
                              <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center text-xs">👕</div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.selectedSize ? `Size: ${item.selectedSize} • ` : ""}
                                {item.selectedColor ? `Color: ${item.selectedColor} • ` : ""}
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Return Reason & Explanation */}
                    <div className="bg-muted/30 p-3 rounded-xl border text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Reason: <span className="font-normal text-muted-foreground capitalize">{ret.reason_category.replace("_", " ")}</span>
                        </span>
                        <span className="font-semibold text-foreground">
                          Resolution: <span className="font-normal text-primary capitalize">{ret.preferred_resolution.replace("_", " ")}</span>
                        </span>
                      </div>
                      <p className="text-muted-foreground pt-1 italic">&quot;{ret.detailed_reason}&quot;</p>
                    </div>

                    {/* Admin Notes if available */}
                    {ret.admin_notes && (
                      <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-xs">
                        <span className="font-semibold text-primary">Admin Response: </span>
                        <span className="text-foreground">{ret.admin_notes}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 border-t text-sm">
                      <span className="text-xs text-muted-foreground">Refund Amount:</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(ret.refund_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-12 bg-muted/10 border rounded-2xl">
              <RotateCcw className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
              <p className="text-base font-semibold">No return requests</p>
              <p className="text-muted-foreground text-xs mt-1 text-center max-w-sm">
                You haven&apos;t submitted any return requests. Delivered orders within the 7-day return policy can be returned from Order History.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
