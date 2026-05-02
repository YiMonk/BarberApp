import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type DiscountType = "percentage" | "fixed";
export type CouponStatus = "active" | "inactive" | "expired";

export interface Coupon {
  id: string;
  provider_account_id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number; // percentage (5-100) or fixed amount
  valid_from: string;
  valid_until?: string;
  max_uses?: number;
  current_uses: number;
  description?: string;
  active: boolean;
  created_at: string;
}

export function useCoupons(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  const fetchCoupons = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("coupons")
        .select("*")
        .eq("provider_account_id", providerId)
        .order("created_at", { ascending: false });

      if (err) throw err;

      setCoupons(data || []);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching coupons";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const createCoupon = useCallback(
    async (couponData: Omit<Coupon, "id" | "created_at" | "current_uses">) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("coupons")
          .insert({
            ...couponData,
            provider_account_id: providerId,
            current_uses: 0,
            code: couponData.code.toUpperCase(),
          })
          .select()
          .single();

        if (err) throw err;

        setCoupons((prev) => [data, ...prev]);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating coupon";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const updateCoupon = useCallback(
    async (couponId: string, updates: Partial<Coupon>) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("coupons")
          .update(updates)
          .eq("id", couponId)
          .select()
          .single();

        if (err) throw err;

        setCoupons((prev) =>
          prev.map((c) => (c.id === couponId ? data : c))
        );
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating coupon";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteCoupon = useCallback(async (couponId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: err } = await supabase
        .from("coupons")
        .delete()
        .eq("id", couponId);

      if (err) throw err;

      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error deleting coupon";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const validateCoupon = useCallback(
    async (code: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
      if (!providerId) return { valid: false, error: "No provider ID" };

      try {
        const { data, error: err } = await supabase
          .from("coupons")
          .select("*")
          .eq("provider_account_id", providerId)
          .eq("code", code.toUpperCase())
          .eq("active", true)
          .single();

        if (err || !data) {
          return { valid: false, error: "Cupón no encontrado" };
        }

        const now = new Date();
        const validFrom = new Date(data.valid_from);
        const validUntil = data.valid_until ? new Date(data.valid_until) : null;

        if (now < validFrom) {
          return { valid: false, error: "Este cupón aún no es válido" };
        }

        if (validUntil && now > validUntil) {
          return { valid: false, error: "Este cupón ha expirado" };
        }

        if (data.max_uses && data.current_uses >= data.max_uses) {
          return { valid: false, error: "Este cupón ha alcanzado su límite de usos" };
        }

        return { valid: true, coupon: data };
      } catch (err) {
        return { valid: false, error: "Error validating coupon" };
      }
    },
    [providerId]
  );

  const calculateDiscount = useCallback(
    (coupon: Coupon, amount: number): { discountAmount: number; finalAmount: number } => {
      let discountAmount = 0;

      if (coupon.discount_type === "percentage") {
        discountAmount = (amount * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      const finalAmount = Math.max(0, amount - discountAmount);
      return { discountAmount, finalAmount };
    },
    []
  );

  return {
    coupons,
    loading,
    error,
    fetchCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    calculateDiscount,
  };
}
