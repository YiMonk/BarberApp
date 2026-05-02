import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ProviderForAdmin {
  id: string;
  auth_user_id: string;
  business_name: string;
  display_name: string;
  email: string;
  phone?: string;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  subscription?: {
    status: string;
    current_period_end: string;
    trial_ends_at?: string;
  };
}

export function useAdminProviders() {
  const [providers, setProviders] = useState<ProviderForAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all providers (admin view)
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("provider_accounts")
        .select(
          `*,
          subscription:subscriptions(status, current_period_end, trial_ends_at)
          `
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData = data?.map((provider: any) => ({
        ...provider,
        subscription: provider.subscription[0] || null,
      })) || [];

      setProviders(transformedData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch providers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle provider active status
  const toggleProvider = useCallback(
    async (providerId: string, isActive: boolean) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("provider_accounts")
          .update({ is_active: !isActive })
          .eq("id", providerId)
          .select()
          .single();

        if (updateError) throw updateError;

        setProviders((prev) =>
          prev.map((p) => (p.id === providerId ? data : p))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update provider";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Extend subscription
  const extendSubscription = useCallback(
    async (providerId: string, daysToAdd: number) => {
      setError(null);

      try {
        const { error: callError } = await supabase.functions.invoke(
          "extend-subscription",
          {
            body: {
              provider_id: providerId,
              days_to_add: daysToAdd,
            },
          }
        );

        if (callError) throw callError;

        // Refetch to update
        await fetchProviders();
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to extend subscription";
        setError(message);
        return { success: false, error: message };
      }
    },
    [fetchProviders]
  );

  return {
    providers,
    loading,
    error,
    fetchProviders,
    toggleProvider,
    extendSubscription,
  };
}
