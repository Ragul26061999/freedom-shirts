"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  Activity,
  Settings,
  Archive,
  RotateCcw,
} from "lucide-react";
import { adminProductService } from "@/services/admin/adminProductService";
import { adminOrderService } from "@/services/admin/adminOrderService";
import { adminUserService } from "@/services/admin/adminUserService";
import { formatCurrency } from "@/utils/formatCurrency";
import Link from "next/link";

interface DashboardStats {
  products: {
    total: number;
    lowStock: number;
    totalValue: number;
  };
  orders: {
    total: number;
    revenue: number;
    averageValue: number;
    pending: number;
  };
  users: {
    total: number;
    active: number;
    admins: number;
    newThisMonth: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, error: adminError } = useAdmin();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data in parallel
      const [productAnalytics, orderAnalytics, userAnalytics] =
        await Promise.all([
          adminProductService.getProductAnalytics(),
          adminOrderService.getOrderAnalytics(),
          adminUserService.getUserAnalytics(),
        ]);

      setStats({
        products: {
          total: productAnalytics.totalProducts,
          lowStock: productAnalytics.lowStockCount,
          totalValue: productAnalytics.totalInventoryValue,
        },
        orders: {
          total: orderAnalytics.totalOrders,
          revenue: orderAnalytics.totalRevenue,
          averageValue: orderAnalytics.averageOrderValue,
          pending: orderAnalytics.ordersByStatus.pending || 0,
        },
        users: {
          total: userAnalytics.totalUsers,
          active: userAnalytics.activeUsers,
          admins: userAnalytics.totalAdmins,
          newThisMonth: userAnalytics.newUsersThisMonth,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (adminError || !isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don&apos;t have admin privileges to access this page.
            </p>
            <Link href="/dashboard">
              <Button>Go to User Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p>Unable to load dashboard data. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.email}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/15 text-primary">
          <Settings className="mr-1 h-3 w-3" />
          Admin
        </Badge>
      </div>

      {/* Overview Stats Cards (Pastel Scheme) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue - Pastel Mint/Emerald */}
        <Card className="relative overflow-hidden border border-emerald-500/20 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-emerald-100/40 dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-teal-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-950 dark:text-emerald-200">
              Total Revenue 
            </CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 tracking-tight">
              {formatCurrency(stats.orders.revenue)}
            </div>
            <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-300/80 mt-1">
              {stats.orders.total} total orders
            </p>
          </CardContent>
        </Card>

        {/* Total Products - Pastel Sky/Blue */}
        <Card className="relative overflow-hidden border border-sky-500/20 bg-gradient-to-br from-sky-50/90 via-blue-50/50 to-indigo-100/40 dark:from-sky-950/40 dark:via-sky-900/20 dark:to-indigo-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-sky-950 dark:text-sky-200">
              Total Products
            </CardTitle>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-sky-950 dark:text-sky-100 tracking-tight">
              {stats.products.total}
            </div>
            <p className="text-xs font-medium text-sky-700/80 dark:text-sky-300/80 mt-1">
              {stats.products.lowStock > 0 ? (
                <span className="text-amber-600 font-semibold">{stats.products.lowStock} low stock</span>
              ) : (
                <span>0 low stock</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Total Users - Pastel Violet/Purple */}
        <Card className="relative overflow-hidden border border-purple-500/20 bg-gradient-to-br from-purple-50/90 via-fuchsia-50/50 to-violet-100/40 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-violet-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-950 dark:text-purple-200">
              Total Users
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-950 dark:text-purple-100 tracking-tight">
              {stats.users.total}
            </div>
            <p className="text-xs font-medium text-purple-700/80 dark:text-purple-300/80 mt-1">
              {stats.users.active} active this month
            </p>
          </CardContent>
        </Card>

        {/* Pending Orders - Pastel Amber/Gold */}
        <Card className="relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-yellow-100/40 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 shadow-xs hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Pending Orders
            </CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-950 dark:text-amber-100 tracking-tight">
              {stats.orders.pending}
            </div>
            <p className="text-xs font-medium text-amber-700/80 dark:text-amber-300/80 mt-1">
              {stats.orders.pending > 0 ? (
                <span className="text-amber-600 font-semibold">Need attention</span>
              ) : (
                <span>Need attention</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
            <Link href="/admin/products">
              <Button className="w-full cursor-pointer font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200" variant="outline">
                <Package className="mr-2 h-4 w-4 text-primary" />
                Products
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button className="w-full cursor-pointer font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200" variant="outline">
                <ShoppingCart className="mr-2 h-4 w-4 text-primary" />
                Orders
              </Button>
            </Link>
            <Link href="/admin/users">
              <Button className="w-full cursor-pointer font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200" variant="outline">
                <Users className="mr-2 h-4 w-4 text-primary" />
                Users
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button className="w-full cursor-pointer font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200" variant="outline">
                <Archive className="mr-2 h-4 w-4 text-primary" />
                Inventory
              </Button>
            </Link>
            <Link href="/admin/returns">
              <Button className="w-full cursor-pointer font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200" variant="outline">
                <RotateCcw className="mr-2 h-4 w-4 text-primary" />
                Returns
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Average Order Value
              </span>
              <span className="font-medium">
                {formatCurrency(stats.orders.averageValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Inventory Value
              </span>
              <span className="font-medium">
                {formatCurrency(stats.products.totalValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                New Users This Month
              </span>
              <span className="font-medium">{stats.users.newThisMonth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Admin Users</span>
              <span className="font-medium">{stats.users.admins}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.products.lowStock > 0 && (
              <div className="flex items-center rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <AlertTriangle className="mr-2 h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Low Stock Alert
                  </p>
                  <p className="text-xs text-yellow-600">
                    {stats.products.lowStock} products are running low on stock
                  </p>
                </div>
              </div>
            )}

            {stats.orders.pending > 0 && (
              <div className="border-primary/30 bg-primary/10 flex items-center rounded-lg border p-3">
                <Activity className="text-primary mr-2 h-4 w-4" />
                <div>
                  <p className="text-primary text-sm font-medium">
                    Pending Orders
                  </p>
                  <p className="text-primary text-xs">
                    {stats.orders.pending} orders are waiting for processing
                  </p>
                </div>
              </div>
            )}

            {stats.products.lowStock === 0 && stats.orders.pending === 0 && (
              <div className="flex items-center rounded-lg border border-green-200 bg-green-50 p-3">
                <Activity className="mr-2 h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    All Clear
                  </p>
                  <p className="text-xs text-green-600">
                    No immediate attention required
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
