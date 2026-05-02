import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  price: number;
  billing_cycle: "monthly" | "yearly";
  features: string[];
  max_appointments?: number;
  max_staff?: number;
  max_clients?: number;
  api_calls?: number;
  custom_branding: boolean;
  priority_support: boolean;
}

export interface Subscription {
  id: string;
  provider_id: string;
  tier: SubscriptionTier;
  status: "active" | "paused" | "cancelled" | "expired";
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  payment_method?: string;
  amount_paid: number;
  created_at: string;
}

const PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    tier: "free",
    name: "Gratuito",
    price: 0,
    billing_cycle: "monthly",
    features: [
      "Hasta 10 citas/mes",
      "1 barbero",
      "Notificaciones básicas",
    ],
    max_appointments: 10,
    max_staff: 1,
    max_clients: 50,
    custom_branding: false,
    priority_support: false,
  },
  starter: {
    tier: "starter",
    name: "Iniciador",
    price: 29000,
    billing_cycle: "monthly",
    features: [
      "Citas ilimitadas",
      "Hasta 3 barberos",
      "Analíticas básicas",
      "Cupones",
    ],
    max_staff: 3,
    max_clients: 500,
    api_calls: 1000,
    custom_branding: false,
    priority_support: false,
  },
  professional: {
    tier: "professional",
    name: "Profesional",
    price: 79000,
    billing_cycle: "monthly",
    features: [
      "Todo del plan Iniciador",
      "Hasta 10 barberos",
      "Analíticas avanzada",
      "API pública",
      "Soporte prioritario",
    ],
    max_staff: 10,
    max_clients: 5000,
    api_calls: 10000,
    custom_branding: true,
    priority_support: true,
  },
  enterprise: {
    tier: "enterprise",
    name: "Empresa",
    price: 0, // Contactar para presupuesto
    billing_cycle: "yearly",
    features: [
      "Todo ilimitado",
      "Gerente de cuenta dedicado",
      "Integraciones personalizadas",
      "SLA garantizado",
    ],
    custom_branding: true,
    priority_support: true,
  },
};

export function useSubscriptions(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  const getCurrentSubscription = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);

    try {
      const { data, error: err } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("provider_id", providerId)
        .eq("status", "active")
        .single();

      if (err && err.code !== "PGRST116") throw err;

      setSubscription(data || null);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching subscription";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const upgradePlan = useCallback(
    async (newTier: SubscriptionTier, billingCycle: "monthly" | "yearly") => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const plan = PLANS[newTier];
        const price = billingCycle === "yearly" ? plan.price * 10 : plan.price;

        const { data, error: err } = await supabase
          .from("subscriptions")
          .upsert({
            provider_id: providerId,
            tier: newTier,
            status: "active",
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(
              Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000
            ).toISOString(),
            amount_paid: price,
            auto_renew: true,
          })
          .select()
          .single();

        if (err) throw err;

        setSubscription(data);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error upgrading plan";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const cancelSubscription = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);

    try {
      const { error: err } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled", auto_renew: false })
        .eq("provider_id", providerId);

      if (err) throw err;

      setSubscription(null);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error cancelling subscription";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return {
    subscription,
    loading,
    error,
    plans: PLANS,
    getCurrentSubscription,
    upgradePlan,
    cancelSubscription,
  };
}
