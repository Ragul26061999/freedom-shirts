"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RotateCcw,
  Search,
  Filter,
  Eye,
  Calendar,
  IndianRupee,
  Package,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ArrowUpDown,
} from "lucide-react";
import {
  useAdminReturns,
  useAdminReturnAnalytics,
} from "@/hooks/queries/use-returns";
import { ReturnRequestType, ReturnStatus, ReturnReasonCategory } from "@/types";
import { formatCurrency } from "@/utils/formatCurrency";
import { format } from "date-fns";
import { ReturnDetailsModal } from "@/components/admin/ReturnDetailsModal";
import Image from "next/image";

const statusOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "approved", label: "Approved" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "received", label: "Item Received" },
  { value: "completed", label: "Completed / Refunded" },
  { value: "rejected", label: "Rejected" },
];

const reasonOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Reasons" },
  { value: "size_issue", label: "Size / Fit Issue" },
  { value: "defective_damaged", label: "Defective / Damaged" },
  { value: "wrong_item", label: "Wrong Item Received" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "not_as_described", label: "Differs from Description" },
  { value: "other", label: "Other" },
];

const getStatusBadge = (status: ReturnStatus) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending Review</Badge>;
    case "approved":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Approved</Badge>;
    case "pickup_scheduled":
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Pickup Scheduled</Badge>;
    case "received":
      return <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">Item Received</Badge>;
    case "completed":
      return <Badge className="bg-green-100 text-green-800 border-green-200">Completed & Refunded</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminReturnsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedReturn, setSelectedReturn] = useState<ReturnRequestType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useAdminReturnAnalytics();
  const { data: returnsData, isLoading: returnsLoading, refetch } = useAdminReturns(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      reasonCategory: reasonFilter !== "all" ? reasonFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: searchTerm || undefined,
    },
    currentPage,
    30
  );

  const returns = returnsData?.returns || [];
  const totalReturns = returnsData?.total || 0;

  const handleOpenDetails = (ret: ReturnRequestType) => {
    setSelectedReturn(ret);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <RotateCcw className="h-7 w-7 text-primary" />
            Return Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review customer claims, verify 7-day policy validity, manage pickups, and process refunds.
          </p>
        </div>

        <Badge variant="outline" className="w-fit px-3 py-1 text-xs bg-muted">
          7-Day Policy Active
        </Badge>
      </div>

      {/* Pastel KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Returns - Pastel Sky */}
        <Card className="relative overflow-hidden border border-sky-500/20 bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-indigo-100/40 dark:from-sky-950/40 dark:via-sky-900/20 dark:to-indigo-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-sky-950 dark:text-sky-200">
              Total Returns
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <RotateCcw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight">
              {analytics?.totalReturns || 0}
            </div>
            <p className="text-xs font-medium text-sky-700/80 dark:text-sky-300/80 mt-1">
              All time return requests
            </p>
          </CardContent>
        </Card>

        {/* Pending Action - Pastel Amber */}
        <Card className="relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-100/40 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Pending Review
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
              {analytics?.pendingReturns || 0}
            </div>
            <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mt-1">
              {(analytics?.pendingReturns || 0) > 0 ? (
                <span className="text-amber-700 font-bold">Needs immediate decision</span>
              ) : (
                <span>All caught up</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Pickup / In Transit - Pastel Violet */}
        <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-violet-100/40 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-violet-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-950 dark:text-purple-200">
              In-Transit / Pickup
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 dark:text-purple-100 tracking-tight">
              {(analytics?.approvedReturns || 0) + (analytics?.inTransitReturns || 0)}
            </div>
            <p className="text-xs font-medium text-purple-700/80 dark:text-purple-300/80 mt-1">
              Approved or pickup scheduled
            </p>
          </CardContent>
        </Card>

        {/* Completed & Refunded - Pastel Emerald */}
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
              Refunds Settled
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight">
              {formatCurrency(analytics?.totalRefundAmount || 0)}
            </div>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 mt-1">
              {analytics?.completedReturns || 0} returns settled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search by Return ID, Order ID, or reason keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(val) => setStatusFilter(val || "all")}
              >
                <SelectTrigger className="w-40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Reason Category Filter */}
              <Select
                value={reasonFilter}
                onValueChange={(val) => setReasonFilter(val || "all")}
              >
                <SelectTrigger className="w-44 text-xs">
                  <SelectValue placeholder="Reason" />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date filters */}
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36 text-xs"
                placeholder="From"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36 text-xs"
                placeholder="To"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <div className="space-y-4">
        {returnsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : returns.length > 0 ? (
          returns.map((ret) => (
            <Card key={ret.id} className="overflow-hidden shadow-xs hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Details */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground">
                        Return #{ret.id}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        for Order <strong>#{ret.order_id}</strong>
                      </span>
                      {getStatusBadge(ret.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(ret.created_at), "MMM dd, yyyy • hh:mm a")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {ret.profile?.username || "Customer"} ({ret.profile?.email || "N/A"})
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <IndianRupee className="h-3.5 w-3.5" />
                        {formatCurrency(ret.refund_amount)}
                      </span>
                    </div>

                    {/* Return Item previews */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ret.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted/40 border rounded-lg px-2.5 py-1 text-xs"
                        >
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.title}
                              width={24}
                              height={24}
                              className="h-6 w-6 rounded object-cover"
                            />
                          ) : (
                            <span className="text-xs">👕</span>
                          )}
                          <span className="font-medium truncate max-w-[150px]">{item.title}</span>
                          <span className="text-muted-foreground">
                            x{item.quantity} {item.selectedSize ? `(${item.selectedSize})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Customer complaint snippet */}
                    <div className="text-xs bg-muted/20 border-l-2 border-primary/50 pl-3 py-1 text-foreground/90 italic line-clamp-1">
                      Reason: <strong className="capitalize not-italic">{ret.reason_category.replace("_", " ")}</strong> — &quot;{ret.detailed_reason}&quot;
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="cursor-pointer font-medium text-xs bg-primary hover:bg-primary/90"
                      onClick={() => handleOpenDetails(ret)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Review Claim
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <RotateCcw className="text-muted-foreground mx-auto mb-3 h-12 w-12 opacity-50" />
              <h3 className="text-base font-semibold text-foreground">
                No return requests found
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No customer returns match the selected status or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Modal */}
      {selectedReturn && (
        <ReturnDetailsModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReturn(null);
          }}
          returnReq={selectedReturn}
          onUpdated={() => refetch()}
        />
      )}
    </div>
  );
}
