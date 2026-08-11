import { db } from "@/lib/firebase/client";
import { collection, doc, getDoc, getDocs, query, where, orderBy, updateDoc } from "firebase/firestore";
import { OrderType } from "@/types";

export interface OrderWithDetails extends Omit<OrderType, "order_items"> {
  profile?: {
    username: string;
    email: string;
  };
  shipping_address?: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
  order_items?: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    product: {
      product_id: string;
      title: string;
      image: string;
    };
  }>;
}

export interface OrderFilters {
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CustomerStat {
  userId: string;
  username: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

export interface OrderAnalytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  recentOrders: OrderWithDetails[];
  topCustomers: CustomerStat[];
}

export const adminOrderService = {
  async getAllOrders(
    filters: OrderFilters = {},
    page: number = 1,
    limit: number = 50,
  ): Promise<{ orders: OrderWithDetails[]; total: number }> {
    try {
      let q = collection(db, "orders") as any;

      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }
      if (filters.userId) {
        q = query(q, where("user_id", "==", filters.userId));
      }

      q = query(q, orderBy("created_at", "desc"));
      const snapshot = await getDocs(q);
      let docs = snapshot.docs;

      // Manual filtering for range/amount since Firestore doesn't support multiple inequalities well
      if (filters.dateFrom) {
        docs = docs.filter((d: any) => d.data().created_at >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        docs = docs.filter((d: any) => d.data().created_at <= filters.dateTo!);
      }
      if (filters.minAmount) {
        docs = docs.filter((d: any) => d.data().total >= filters.minAmount!);
      }
      if (filters.maxAmount) {
        docs = docs.filter((d: any) => d.data().total <= filters.maxAmount!);
      }

      const total = docs.length;
      
      // Pagination
      const start = (page - 1) * limit;
      const paginatedDocs = docs.slice(start, start + limit);

      const orders = await Promise.all(
        paginatedDocs.map(async (d: any) => {
          const data = d.data();
          let profile = null;
          if (data.user_id) {
            const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
            if (profileDoc.exists()) profile = profileDoc.data();
          }

          let address = null;
          if (data.address_id) {
            const addressDoc = await getDoc(doc(db, "addresses", data.address_id));
            if (addressDoc.exists()) address = addressDoc.data();
          }

          return {
            id: d.id,
            ...data,
            profile,
            shipping_address: address,
          } as OrderWithDetails;
        })
      );

      return { orders, total };
    } catch (error) {
      console.error("Error fetching all orders:", error);
      throw error;
    }
  },

  async getOrderAnalytics(): Promise<OrderAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      let totalRevenue = 0;
      const ordersByStatus: Record<string, number> = {};
      const customerMap: Record<string, CustomerStat> = {};

      orders.forEach((order) => {
        totalRevenue += order.total || 0;
        const status = order.status || "unknown";
        ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;

        if (order.user_id) {
          if (!customerMap[order.user_id]) {
            customerMap[order.user_id] = {
              userId: order.user_id,
              username: "User",
              email: "User",
              totalOrders: 0,
              totalSpent: 0
            };
          }
          customerMap[order.user_id].totalOrders += 1;
          customerMap[order.user_id].totalSpent += order.total || 0;
        }
      });

      const topCustomers = Object.values(customerMap)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);

      // Fetch customer details
      for (const customer of topCustomers) {
        const pDoc = await getDoc(doc(db, "profiles", customer.userId));
        if (pDoc.exists()) {
          customer.username = pDoc.data()?.username || "User";
          customer.email = pDoc.data()?.email || "User";
        }
      }

      // get 5 most recent orders
      const recentOrdersList = orders
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 5);
        
      const recentOrders = await Promise.all(
        recentOrdersList.map(async (data: any) => {
          let profile = null;
          if (data.user_id) {
            const profileDoc = await getDoc(doc(db, "profiles", data.user_id));
            if (profileDoc.exists()) profile = profileDoc.data();
          }
          return { ...data, profile } as OrderWithDetails;
        })
      );

      return {
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        ordersByStatus,
        recentOrders,
        topCustomers
      };
    } catch (error) {
      console.error("Error fetching order analytics:", error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      return false;
    }
  }
};
