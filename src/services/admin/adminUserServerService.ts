import { db } from "@/lib/firebase/client";
import { collection, doc, getDoc, getDocs, query, where, orderBy, updateDoc, deleteDoc } from "firebase/firestore";
import { ProfileType } from "@/types";

export interface UserFilters {
  role?: "admin" | "user";
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  isActive?: boolean;
}

export interface UserWithStats {
  profile_id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  is_active: boolean;
  top_products: { name: string; quantity: number }[];
}

export const adminUserServerService = {
  async getAllUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{ users: UserWithStats[]; total: number }> {
    try {
      let q = collection(db, "profiles") as any;

      if (filters.role) {
        q = query(q, where("role", "==", filters.role));
      }
      
      q = query(q, orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      let docs = snapshot.docs;

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        docs = docs.filter((d: any) => {
          const data = d.data();
          return (data.username || "").toLowerCase().includes(term) || 
                 (data.email || "").toLowerCase().includes(term);
        });
      }
      if (filters.dateFrom) docs = docs.filter((d: any) => d.data().created_at >= filters.dateFrom!);
      if (filters.dateTo) docs = docs.filter((d: any) => d.data().created_at <= filters.dateTo!);

      const total = docs.length;
      const start = (page - 1) * limit;
      const paginatedDocs = docs.slice(start, start + limit);

      const usersWithStats = await Promise.all(
        paginatedDocs.map(async (d: any) => {
          const user = d.data();
          const profile_id = d.id;

          const ordersSnap = await getDocs(query(collection(db, "orders"), where("user_id", "==", profile_id)));
          const userOrders = ordersSnap.docs.map(o => ({ id: o.id, ...o.data() } as any));

          const totalOrders = userOrders.length;
          const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
          
          userOrders.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          const lastOrderAt = userOrders[0]?.created_at || null;

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const isActive = userOrders.some(o => new Date(o.created_at) > thirtyDaysAgo);

          const topProducts: any[] = [];

          return {
            profile_id,
            username: user.username || "",
            email: user.email || "",
            role: user.role || "user",
            created_at: user.created_at || "",
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_at: lastOrderAt,
            is_active: isActive,
            top_products: topProducts,
          };
        })
      );

      return { users: usersWithStats, total };
    } catch (err) {
      console.error("Failed to get all users:", err);
      return { users: [], total: 0 };
    }
  },

  async updateUserRole(
    userId: string,
    role: "admin" | "user",
  ): Promise<ProfileType | null> {
    try {
      await updateDoc(doc(db, "profiles", userId), { role });
      const d = await getDoc(doc(db, "profiles", userId));
      return { profile_id: d.id, ...d.data() } as ProfileType;
    } catch (err) {
      console.error("Failed to update user role:", err);
      return null;
    }
  },

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, "profiles", userId));
      return true;
    } catch (err) {
      console.error("Failed to delete user:", err);
      return false;
    }
  },

  async getUserAnalytics(): Promise<any> {
    try {
      const snapshot = await getDocs(collection(db, "profiles"));
      const users = snapshot.docs;
      
      const roleDistribution = {
        admin: users.filter(u => u.data().role === "admin").length,
        user: users.filter(u => u.data().role !== "admin").length
      };

      return {
        totalUsers: users.length,
        newUsersThisMonth: 0,
        activeUsers: users.length,
        roleDistribution
      };
    } catch (error) {
      console.error("Error fetching user analytics:", error);
      throw error;
    }
  }
};
