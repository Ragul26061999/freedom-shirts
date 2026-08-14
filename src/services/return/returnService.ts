import { db } from "@/lib/firebase/client";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { OrderType, ReturnRequestType, ReturnReasonCategory } from "@/types";

export interface CreateReturnInput {
  order: OrderType;
  userId: string;
  items: Array<{
    product_id: string;
    title: string;
    image?: string;
    quantity: number;
    price: number;
    selectedColor?: string;
    selectedSize?: string;
  }>;
  reasonCategory: ReturnReasonCategory;
  detailedReason: string;
  proofImages?: string[];
  preferredResolution: "refund" | "replacement" | "store_credit";
}

export interface ReturnEligibilityResult {
  isEligible: boolean;
  daysRemaining: number;
  deliveryDate: Date | null;
  deadlineDate: Date | null;
  reason?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const returnService = {
  /**
   * Evaluates if an order is within the 7-day return window from delivery date.
   */
  checkEligibility(order: OrderType): ReturnEligibilityResult {
    if (order.status !== "delivered") {
      return {
        isEligible: false,
        daysRemaining: 0,
        deliveryDate: null,
        deadlineDate: null,
        reason: "Only delivered orders are eligible for return.",
      };
    }

    if (order.has_return || order.return_status) {
      return {
        isEligible: false,
        daysRemaining: 0,
        deliveryDate: null,
        deadlineDate: null,
        reason: `A return request has already been submitted (${order.return_status || "pending"}).`,
      };
    }

    // Determine delivery timestamp
    let deliveryDate: Date | null = null;
    if (order.delivered_at) {
      deliveryDate = new Date(order.delivered_at);
    } else if (order.updated_at) {
      deliveryDate = new Date(order.updated_at);
    } else if (order.created_at) {
      deliveryDate = new Date(order.created_at);
    }

    if (!deliveryDate || isNaN(deliveryDate.getTime())) {
      deliveryDate = new Date();
    }

    const deadlineDate = new Date(deliveryDate.getTime() + SEVEN_DAYS_MS);
    const now = new Date();
    const msRemaining = deadlineDate.getTime() - now.getTime();

    if (msRemaining <= 0) {
      return {
        isEligible: false,
        daysRemaining: 0,
        deliveryDate,
        deadlineDate,
        reason: `The 7-day return window expired on ${deadlineDate.toLocaleDateString()}.`,
      };
    }

    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    return {
      isEligible: true,
      daysRemaining,
      deliveryDate,
      deadlineDate,
    };
  },

  /**
   * Creates a new return request in Firestore
   */
  async createReturnRequest(input: CreateReturnInput): Promise<ReturnRequestType> {
    const { order, userId, items, reasonCategory, detailedReason, proofImages, preferredResolution } = input;

    if (!userId) {
      throw new Error("User authentication required");
    }

    if (!items || items.length === 0) {
      throw new Error("Please select at least one item to return");
    }

    if (!detailedReason || detailedReason.trim().length < 10) {
      throw new Error("Please provide a detailed explanation (minimum 10 characters)");
    }

    // Verify 7-day eligibility rule
    const eligibility = this.checkEligibility(order);
    if (!eligibility.isEligible) {
      throw new Error(eligibility.reason || "This order is not eligible for return");
    }

    const returnId = `RET-${order.id}-${Date.now().toString().slice(-4)}`;
    const totalRefundAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const newReturn: ReturnRequestType = {
      id: returnId,
      order_id: order.id,
      user_id: userId,
      created_at: new Date().toISOString(),
      delivered_at: eligibility.deliveryDate ? eligibility.deliveryDate.toISOString() : new Date().toISOString(),
      items,
      reason_category: reasonCategory,
      detailed_reason: detailedReason.trim(),
      proof_images: proofImages || [],
      preferred_resolution: preferredResolution,
      status: "pending",
      refund_amount: totalRefundAmount,
      refund_status: "pending",
      restocked: false,
    };

    // Save to Firestore returns collection
    const returnRef = doc(db, "returns", returnId);
    await setDoc(returnRef, newReturn);

    // Update order record to reference return
    try {
      const orderRef = doc(db, "orders", order.id.toString());
      await updateDoc(orderRef, {
        has_return: true,
        return_status: "pending",
        return_id: returnId,
        updated_at: new Date().toISOString(),
      });
    } catch (orderUpdateErr) {
      console.warn("Could not update order doc in Firestore directly:", orderUpdateErr);
    }

    return newReturn;
  },

  /**
   * Fetch all returns requested by a specific user
   */
  async getUserReturns(userId: string): Promise<ReturnRequestType[]> {
    try {
      const q = query(
        collection(db, "returns"),
        where("user_id", "==", userId)
      );
      const snapshot = await getDocs(q);
      
      const returns = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Record<string, any>),
      })) as ReturnRequestType[];

      // Sort by created_at desc in memory to avoid needing a composite index
      returns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return returns;
    } catch (error) {
      console.error("Error fetching user returns:", error);
      return [];
    }
  },

  /**
   * Fetch a single return request by ID
   */
  async getReturnById(returnId: string): Promise<ReturnRequestType | null> {
    try {
      const docRef = doc(db, "returns", returnId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as ReturnRequestType;
    } catch (error) {
      console.error("Error fetching return by ID:", error);
      return null;
    }
  },
};
