import { db } from "@/lib/firebase/client";
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

export interface ShippingRateType {
  id: string;
  state: string;
  district?: string;
  charge: number;
}

export const shippingService = {
  getShippingRates: async (): Promise<ShippingRateType[]> => {
    try {
      const snapshot = await getDocs(collection(db, "shipping_rates"));
      if (snapshot.empty) {
        return [
          { id: "1", state: "California", charge: 10.00 },
          { id: "2", state: "New York", charge: 15.00 },
        ];
      }
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingRateType));
    } catch (err) {
      console.error("Error fetching shipping rates:", err);
      return [];
    }
  },

  calculateShippingCharge: async (state: string, district?: string): Promise<number> => {
    try {
      const rates = await shippingService.getShippingRates();
      const exactMatch = rates.find(r => r.state === state && r.district === district);
      if (exactMatch) return exactMatch.charge;
      const stateMatch = rates.find(r => r.state === state && !r.district);
      if (stateMatch) return stateMatch.charge;
      return 10.00; // default fallback
    } catch {
      return 10.00;
    }
  },

  createShippingRate: async (data: Omit<ShippingRateType, "id">): Promise<ShippingRateType> => {
    try {
      const docRef = await addDoc(collection(db, "shipping_rates"), data);
      return { id: docRef.id, ...data };
    } catch (err) {
      console.error("Error creating shipping rate:", err);
      throw err;
    }
  },

  updateShippingRate: async (id: string, data: Partial<Omit<ShippingRateType, "id">>): Promise<ShippingRateType> => {
    try {
      const docRef = doc(db, "shipping_rates", id);
      await updateDoc(docRef, data);
      const snap = await getDoc(docRef);
      return { id: snap.id, ...snap.data() } as ShippingRateType;
    } catch (err) {
      console.error("Error updating shipping rate:", err);
      throw err;
    }
  },

  deleteShippingRate: async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "shipping_rates", id));
      return true;
    } catch (err) {
      console.error("Error deleting shipping rate:", err);
      throw err;
    }
  }
};
