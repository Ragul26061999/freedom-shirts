import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  increment,
} from "firebase/firestore";
import { ReturnRequestType, ReturnStatus, ReturnReasonCategory } from "@/types";

export interface ReturnFilters {
  status?: string;
  reasonCategory?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface ReturnAnalytics {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  inTransitReturns: number;
  receivedReturns: number;
  completedReturns: number;
  rejectedReturns: number;
  totalRefundAmount: number;
}

export const adminReturnService = {
  /**
   * Fetch all returns with batch enrichment for customer profiles
   */
  async getAllReturns(
    filters: ReturnFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ returns: ReturnRequestType[]; total: number }> {
    try {
      const snapshot = await getDocs(collection(db, "returns"));
      let returnDocs = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Record<string, any>),
      })) as ReturnRequestType[];

      // Filter by status
      if (filters.status && filters.status !== "all") {
        returnDocs = returnDocs.filter((r) => r.status === filters.status);
      }
      
      // Filter by reason category
      if (filters.reasonCategory && filters.reasonCategory !== "all") {
        returnDocs = returnDocs.filter((r) => r.reason_category === filters.reasonCategory);
      }

      // Sort by created_at desc
      returnDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Manual filtering for dates & search term
      if (filters.dateFrom) {
        returnDocs = returnDocs.filter((r) => r.created_at >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        returnDocs = returnDocs.filter((r) => r.created_at <= filters.dateTo!);
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase();
        returnDocs = returnDocs.filter(
          (r) =>
            r.id.toLowerCase().includes(s) ||
            r.order_id.toString().includes(s) ||
            r.user_id.toLowerCase().includes(s) ||
            r.detailed_reason.toLowerCase().includes(s)
        );
      }

      const total = returnDocs.length;
      const start = (page - 1) * limit;
      const paginatedReturns = returnDocs.slice(start, start + limit);

      // Enrich with customer profile in parallel
      const userIds = Array.from(new Set(paginatedReturns.map((r) => r.user_id).filter(Boolean)));
      const profileMap = new Map<string, { username: string; email: string }>();

      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const pDoc = await getDoc(doc(db, "profiles", uid));
            if (pDoc.exists()) {
              const data = pDoc.data();
              profileMap.set(uid, {
                username: data.username || "Customer",
                email: data.email || "N/A",
              });
            }
          } catch {
            // ignore
          }
        })
      );

      const enrichedReturns = paginatedReturns.map((ret) => ({
        ...ret,
        profile: profileMap.get(ret.user_id) || { username: "Customer", email: "N/A" },
      }));

      return { returns: enrichedReturns, total };
    } catch (error) {
      console.error("Error fetching admin returns:", error);
      return { returns: [], total: 0 };
    }
  },

  /**
   * Get KPI statistics for return management
   */
  async getReturnAnalytics(): Promise<ReturnAnalytics> {
    try {
      const snapshot = await getDocs(collection(db, "returns"));
      const returns = snapshot.docs.map((d) => d.data() as ReturnRequestType);

      let pendingReturns = 0;
      let approvedReturns = 0;
      let inTransitReturns = 0;
      let receivedReturns = 0;
      let completedReturns = 0;
      let rejectedReturns = 0;
      let totalRefundAmount = 0;

      returns.forEach((r) => {
        if (r.status === "pending") pendingReturns++;
        else if (r.status === "approved") approvedReturns++;
        else if (r.status === "pickup_scheduled") inTransitReturns++;
        else if (r.status === "received") receivedReturns++;
        else if (r.status === "completed") {
          completedReturns++;
          totalRefundAmount += r.refund_amount || 0;
        } else if (r.status === "rejected") rejectedReturns++;
      });

      return {
        totalReturns: returns.length,
        pendingReturns,
        approvedReturns,
        inTransitReturns,
        receivedReturns,
        completedReturns,
        rejectedReturns,
        totalRefundAmount,
      };
    } catch (error) {
      console.error("Error fetching return analytics:", error);
      return {
        totalReturns: 0,
        pendingReturns: 0,
        approvedReturns: 0,
        inTransitReturns: 0,
        receivedReturns: 0,
        completedReturns: 0,
        rejectedReturns: 0,
        totalRefundAmount: 0,
      };
    }
  },

  /**
   * Update return status, record notes, and optionally restock inventory
   */
  async updateReturnStatus(
    returnId: string,
    newStatus: ReturnStatus,
    adminNotes?: string,
    shouldRestock: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const returnRef = doc(db, "returns", returnId);
      const returnSnap = await getDoc(returnRef);

      if (!returnSnap.exists()) {
        return { success: false, error: "Return record not found" };
      }

      const returnData = returnSnap.data() as ReturnRequestType;
      const updates: Partial<ReturnRequestType> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (adminNotes !== undefined) {
        updates.admin_notes = adminNotes;
      }

      // Restock inventory if item is received or completed and hasn't been restocked yet
      if (shouldRestock && !returnData.restocked && returnData.items && returnData.items.length > 0) {
        for (const item of returnData.items) {
          try {
            const productRef = doc(db, "products", item.product_id);
            await updateDoc(productRef, {
              stock: increment(item.quantity || 1),
              updated_at: new Date().toISOString(),
            });
          } catch (prodErr) {
            console.warn(`Could not auto-restock product ${item.product_id}:`, prodErr);
          }
        }
        updates.restocked = true;
      }

      if (newStatus === "completed") {
        updates.refund_status = "processed";
      }

      await updateDoc(returnRef, updates as any);

      // Sync status to the order doc
      if (returnData.order_id) {
        try {
          const orderRef = doc(db, "orders", returnData.order_id.toString());
          await updateDoc(orderRef, {
            return_status: newStatus,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // ignore
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error updating return status:", error);
      return { success: false, error: error.message || "Failed to update return status" };
    }
  },
};
