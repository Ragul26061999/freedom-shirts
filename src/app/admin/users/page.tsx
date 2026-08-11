import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ShoppingCart,
  User,
  Mail,
  Shield,
  UserCheck,
  Trophy,
  TrendingUp,
  Package,
  IndianRupee,
  Clock,
  Users,
} from "lucide-react";

import { format, formatDistanceToNow } from "date-fns";
import { AdminUsersClient } from "./AdminUsersClient";
import { getCurrentUser } from "@/services/auth/authServerService";
import {
  adminUserServerService,
  UserFilters,
  UserWithStats,
} from "@/services/admin/adminUserServerService";
import { formatCurrency } from "@/utils/formatCurrency";

interface AdminUsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

const getParam = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

function getMedalEmoji(rank: number) {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return `#${rank + 1}`;
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/signin");
  }

  const filters: UserFilters = {
    searchTerm: getParam(resolvedSearchParams.search),
    role: getParam(resolvedSearchParams.role) as "admin" | "user" | undefined,
    dateFrom: getParam(resolvedSearchParams.dateFrom),
  };

  const currentPage = parseInt(getParam(resolvedSearchParams.page) || "1", 10);
  const pageLimit = 20;

  const { users, total } = await adminUserServerService.getAllUsers(
    filters,
    currentPage,
    pageLimit,
  );

  const totalPages = Math.ceil(total / pageLimit);

  // Top spenders (sorted by amount) for leaderboard
  const topSpenders = [...users]
    .sort((a, b) => b.total_spent - a.total_spent)
    .slice(0, 5);

  // Summary stats
  const totalRevenue = users.reduce((sum, u) => sum + u.total_spent, 0);
  const activeUsers = users.filter((u) => u.is_active).length;
  const totalOrders = users.reduce((sum, u) => sum + u.total_orders, 0);

  return (
    <div className="container mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Deep analytics on every customer — who's buying, how much, and what.
          </p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary text-sm px-3 py-1">
          <Users className="mr-1 h-4 w-4" />
          {total} Total Users
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active (30d)</p>
                <p className="text-2xl font-bold">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <IndianRupee className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Spenders Leaderboard */}
      {topSpenders.some((u) => u.total_spent > 0) && (
        <Card className="border-yellow-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Customers Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSpenders.map((user, rank) => (
                <div
                  key={user.profile_id}
                  className={`flex items-center gap-4 p-3 rounded-xl ${
                    rank === 0
                      ? "bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"
                      : "bg-muted/40"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{getMedalEmoji(rank)}</span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(user.total_spent)}</p>
                    <p className="text-xs text-muted-foreground">{user.total_orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <AdminUsersClient
            currentFilters={filters}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {users.length > 0 ? (
          users.map((user: UserWithStats) => {
            const rank = topSpenders.findIndex((u) => u.profile_id === user.profile_id);
            return (
              <Card
                key={user.profile_id}
                className={`hover:shadow-md transition-shadow ${
                  rank === 0 ? "border-yellow-300" : rank === 1 ? "border-gray-300" : rank === 2 ? "border-amber-400" : ""
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                    {/* User Identity */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        {rank >= 0 && rank <= 2 && (
                          <span className="absolute -top-1 -right-1 text-base">{getMedalEmoji(rank)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg truncate">{user.username}</h3>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Joined {format(new Date(user.created_at), "MMM dd, yyyy")}
                          </span>
                          {user.last_order_at && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" />
                              Last order {formatDistanceToNow(new Date(user.last_order_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Order Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1">
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="text-xs text-muted-foreground font-medium">Orders</span>
                        </div>
                        <p className="text-2xl font-bold">{user.total_orders}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-muted-foreground font-medium">Total Spent</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(user.total_spent)}</p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <IndianRupee className="h-4 w-4 text-purple-500" />
                          <span className="text-xs text-muted-foreground font-medium">Avg. Order</span>
                        </div>
                        <p className="text-xl font-bold text-purple-600">
                          {user.total_orders > 0
                            ? formatCurrency(user.total_spent / user.total_orders)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Badges & Top Products */}
                    <div className="flex flex-col gap-3 lg:w-52 flex-shrink-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                        {user.is_active ? (
                          <Badge className="bg-green-100 text-green-800">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {user.top_products.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                            <Package className="h-3.5 w-3.5" /> Top Purchases
                          </p>
                          <div className="space-y-1">
                            {user.top_products.map((p, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs bg-muted/50 rounded-md px-2 py-1"
                              >
                                <span className="truncate max-w-[130px]">{p.name}</span>
                                <span className="font-semibold ml-2 text-primary flex-shrink-0">×{p.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {user.total_orders === 0 && (
                        <p className="text-xs text-muted-foreground italic">No purchases yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <User className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h3 className="text-lg font-medium">No users found</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                No users match your current filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-muted-foreground text-center text-sm sm:text-left">
                Showing {(currentPage - 1) * pageLimit + 1} to{" "}
                {Math.min(currentPage * pageLimit, total)} of {total} users
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
