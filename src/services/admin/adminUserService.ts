import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ProfileType } from "@/types";

export interface UserWithStats extends ProfileType {
  total_orders?: number;
  total_spent?: number;
  last_order_date?: string;
  is_active?: boolean;
}

export interface UserFilters {
  role?: "admin" | "user";
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  totalAdmins: number;
  usersByRole: Record<string, number>;
  topSpenders: UserWithStats[];
}

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null) {
    const maybe = value as { toDate?: () => Date; seconds?: number };
    if (typeof maybe.toDate === "function") return maybe.toDate();
    if (typeof maybe.seconds === "number") return new Date(maybe.seconds * 1000);
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Client-side admin analytics backed by Firestore.
 */
export const adminUserService = {
  async getAllUsers(): Promise<{ users: UserWithStats[]; total: number }> {
    try {
      const snapshot = await getDocs(collection(db, "profiles"));
      const users = snapshot.docs.map((docSnap) => ({
        profile_id: docSnap.id,
        ...docSnap.data(),
      })) as unknown as UserWithStats[];

      return { users, total: users.length };
    } catch (error) {
      console.error("Failed to get all users:", error);
      return { users: [], total: 0 };
    }
  },

  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const [profilesSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db, "profiles")),
        getDocs(collection(db, "orders")).catch(() => null),
      ]);

      const profiles = profilesSnap.docs.map((docSnap) => ({
        profile_id: docSnap.id,
        ...docSnap.data(),
      })) as unknown as UserWithStats[];

      const ordersByUser = new Map<string, { total: number; createdAt: Date | null }[]>();
      ordersSnap?.docs.forEach((orderDoc) => {
        const order = orderDoc.data();
        const userId = order.user_id;
        if (!userId) return;
        const list = ordersByUser.get(userId) ?? [];
        list.push({ total: Number(order.total) || 0, createdAt: toDate(order.created_at) });
        ordersByUser.set(userId, list);
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const usersWithOrders = profiles.map((profile) => {
        const orders = ordersByUser.get(profile.profile_id ?? "") ?? [];
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
        const isActive = orders.some(
          (order) => order.createdAt !== null && order.createdAt >= thirtyDaysAgo
        );

        return {
          ...profile,
          total_orders: orders.length,
          total_spent: Number(totalSpent.toFixed(2)),
          is_active: isActive,
        };
      });

      const usersByRole = usersWithOrders.reduce<Record<string, number>>(
        (acc, user) => {
          const role = user.role || "user";
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        },
        {}
      );

      return {
        totalUsers: usersWithOrders.length,
        activeUsers: usersWithOrders.filter((user) => user.is_active).length,
        newUsersThisMonth: profiles.filter((profile) => {
          const created = toDate(profile.created_at);
          return created !== null && created >= thisMonth;
        }).length,
        totalAdmins: usersWithOrders.filter((user) => user.role === "admin").length,
        usersByRole,
        topSpenders: usersWithOrders
          .filter((user) => (user.total_spent ?? 0) > 0)
          .sort((a, b) => (b.total_spent ?? 0) - (a.total_spent ?? 0))
          .slice(0, 10),
      };
    } catch (error) {
      console.error("Failed to build user analytics:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        totalAdmins: 0,
        usersByRole: {},
        topSpenders: [],
      };
    }
  },
};
