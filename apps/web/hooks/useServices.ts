import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Service {
  id: string;
  provider_account_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export function useServices(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  const fetchServices = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("services")
        .select("*")
        .eq("provider_account_id", providerId)
        .order("display_order");

      if (fetchError) throw fetchError;
      setServices(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch services";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const createService = useCallback(
    async (
      name: string,
      durationMinutes: number,
      price: number,
      description?: string
    ) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        const maxOrder = services.length > 0
          ? Math.max(...services.map((s) => s.display_order))
          : 0;

        const { data, error: insertError } = await supabase
          .from("services")
          .insert({
            provider_account_id: providerId,
            name,
            description,
            duration_minutes: durationMinutes,
            price,
            is_active: true,
            display_order: maxOrder + 1,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setServices((prev) => [...prev, data]);
        return { success: true, service: data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create service";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId, services]
  );

  const updateService = useCallback(
    async (id: string, updates: Partial<Service>) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("services")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (updateError) throw updateError;

        setServices((prev) =>
          prev.map((s) => (s.id === id ? data : s))
        );
        return { success: true, service: data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update service";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const deleteService = useCallback(async (id: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setServices((prev) => prev.filter((s) => s.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete service";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
  };
}
