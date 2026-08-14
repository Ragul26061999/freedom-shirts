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

      // Manual filtering for range/amount
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

      // Collect unique user_ids and address_ids for batch fetching
      const userIds = Array.from(new Set(paginatedDocs.map((d: any) => d.data().user_id).filter(Boolean)));
      const addressIds = Array.from(
        new Set(paginatedDocs.map((d: any) => d.data().shipping_address_id || d.data().address_id).filter(Boolean))
      );

      // Parallel batch fetch profiles and addresses
      const [profilesArr, addressesArr, itemsSnapshots] = await Promise.all([
        Promise.all(
          userIds.map(async (uid) => {
            const snap = await getDoc(doc(db, "profiles", uid as string)).catch(() => null);
            return snap?.exists() ? { id: uid, data: snap.data() } : null;
          })
        ),
        Promise.all(
          addressIds.map(async (aid) => {
            const snap = await getDoc(doc(db, "addresses", aid as string)).catch(() => null);
            return snap?.exists() ? { id: aid, data: snap.data() } : null;
          })
        ),
        Promise.all(
          paginatedDocs.map((d: any) =>
            getDocs(query(collection(db, "order_items"), where("order_id", "==", d.id))).catch(() => ({ docs: [] }))
          )
        )
      ]);

      const profileMap = new Map<string, any>();
      profilesArr.forEach((p) => {
        if (p) profileMap.set(p.id as string, p.data);
      });

      const addressMap = new Map<string, any>();
      addressesArr.forEach((a) => {
        if (a) addressMap.set(a.id as string, a.data);
      });

      // Collect unique product IDs across all order items in this page
      const productIds = new Set<string>();
      itemsSnapshots.forEach((itemsSnap: any) => {
        itemsSnap.docs.forEach((itemDoc: any) => {
          const pid = itemDoc.data().product_id;
          if (pid) productIds.add(pid);
        });
      });

      // Parallel fetch unique products
      const productsArr = await Promise.all(
        Array.from(productIds).map(async (pid) => {
          const snap = await getDoc(doc(db, "products", pid)).catch(() => null);
          if (snap?.exists()) {
            const pData = snap.data();
            return {
              id: pid,
              title: pData.title || "Unknown Product",
              image: Array.isArray(pData.images) && pData.images.length > 0 ? pData.images[0] : (pData.image || "")
            };
          }
          return { id: pid, title: "Unknown Product", image: "" };
        })
      );

      const productMap = new Map<string, any>();
      productsArr.forEach((p) => {
        productMap.set(p.id, p);
      });

      const orders = paginatedDocs.map((d: any, index: number) => {
        const data = d.data();
        const profile = data.user_id ? profileMap.get(data.user_id) || null : null;
        const addressId = data.shipping_address_id || data.address_id;
        const address = addressId ? addressMap.get(addressId) || null : null;

        const itemsSnap = itemsSnapshots[index];
        const order_items = itemsSnap.docs.map((itemDoc: any) => {
          const itemData = itemDoc.data();
          const product = productMap.get(itemData.product_id) || {
            product_id: itemData.product_id,
            title: "Unknown Product",
            image: ""
          };
          return { id: itemDoc.id, ...itemData, product };
        });

        return {
          id: d.id,
          ...data,
          profile,
          shipping_address: address,
          order_items,
        } as OrderWithDetails;
      });

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

      // get 5 most recent orders
      const recentOrdersList = orders
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 5);

      // Collect unique user_ids to batch fetch profiles for analytics
      const analyticsUserIds = Array.from(
        new Set([...topCustomers.map((c) => c.userId), ...recentOrdersList.map((o: any) => o.user_id)].filter(Boolean))
      );

      const profileSnaps = await Promise.all(
        analyticsUserIds.map(async (uid) => {
          const snap = await getDoc(doc(db, "profiles", uid)).catch(() => null);
          return snap?.exists() ? { id: uid, data: snap.data() } : null;
        })
      );

      const profileMap = new Map<string, any>();
      profileSnaps.forEach((p) => {
        if (p) profileMap.set(p.id, p.data);
      });

      // Update customer details from map
      topCustomers.forEach((customer) => {
        const p = profileMap.get(customer.userId);
        if (p) {
          customer.username = p.username || "User";
          customer.email = p.email || "User";
        }
      });

      const recentOrders = recentOrdersList.map((data: any) => {
        const profile = data.user_id ? profileMap.get(data.user_id) || null : null;
        return { ...data, profile } as OrderWithDetails;
      });

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
      const updatePayload: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === "delivered") {
        updatePayload.delivered_at = new Date().toISOString();
      }
      
      await updateDoc(doc(db, "orders", orderId), updatePayload);
      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      return false;
    }
  }
};
