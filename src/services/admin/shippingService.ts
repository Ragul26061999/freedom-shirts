import { supabase } from "@/lib/supabase/client";
import { ShippingRateType } from "@/types";

export const shippingService = {
  async getShippingRates(): Promise<ShippingRateType[]> {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shipping rates:", error);
      throw error;
    }
    return data || [];
  },

  async createShippingRate(rateData: Omit<ShippingRateType, "id" | "created_at">): Promise<ShippingRateType> {
    const { data, error } = await supabase
      .from("shipping_rates")
      .insert({
        state: rateData.state,
        district: rateData.district || null,
        charge: rateData.charge,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating shipping rate:", error);
      throw error;
    }
    return data;
  },

  async updateShippingRate(id: number, rateData: Partial<ShippingRateType>): Promise<ShippingRateType> {
    const { data, error } = await supabase
      .from("shipping_rates")
      .update(rateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shipping rate:", error);
      throw error;
    }
    return data;
  },

  async deleteShippingRate(id: number): Promise<boolean> {
    const { error } = await supabase
      .from("shipping_rates")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting shipping rate:", error);
      throw error;
    }
    return true;
  },

  async calculateShippingCharge(state: string, district?: string): Promise<number> {
    // Priority: Exact District Match > State Match > Default (0)
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("*")
      .ilike("state", state);

    if (error || !data || data.length === 0) {
      return 0; // Free shipping fallback
    }

    // Check district match (case-insensitive)
    if (district) {
      const districtMatch = data.find((r) => r.district && r.district.toLowerCase() === district.toLowerCase());
      if (districtMatch) return districtMatch.charge;
    }

    // Check state-level match (district is null)
    const stateMatch = data.find((r) => !r.district);
    if (stateMatch) return stateMatch.charge;

    return 0;
  }
};
