import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface LoyaltyProgram {
  id: string;
  provider_account_id: string;
  name: string;
  description?: string;
  mechanic: "punch_card" | "nth_visit_discount" | "birthday_bonus" | "time_limited_promo";
  config: Record<string, any>;
  applicable_service_ids?: string[];
  is_active: boolean;
  starts_at: string;
  ends_at?: string;
  terms?: string;
  created_at: string;
}

export interface LoyaltyProgress {
  id: string;
  loyalty_program_id: string;
  client_provider_link_id: string;
  current_value: number;
  rewards_earned: number;
  rewards_redeemed: number;
  last_progress_at?: string;
}

export interface LoyaltyReward {
  id: string;
  loyalty_program_id: string;
  client_provider_link_id: string;
  reward_type: "free_service" | "percentage_discount" | "fixed_discount";
  reward_value?: number;
  status: "available" | "reserved" | "redeemed" | "expired" | "cancelled";
  applied_to_appointment_id?: string;
  expires_at?: string;
  earned_at: string;
  redeemed_at?: string;
}

export function useLoyalty(providerId: string | null) {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch loyalty programs for provider
  const fetchPrograms = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("provider_account_id", providerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setPrograms(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch loyalty programs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Create loyalty program
  const createProgram = useCallback(
    async (
      name: string,
      mechanic: LoyaltyProgram["mechanic"],
      config: Record<string, any>,
      description?: string,
      applicableServiceIds?: string[]
    ) => {
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from("loyalty_programs")
          .insert({
            provider_account_id: providerId,
            name,
            mechanic,
            config,
            description: description || null,
            applicable_service_ids: applicableServiceIds || null,
            is_active: true,
            starts_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setPrograms((prev) => [data, ...prev]);
        return { success: true, program: data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create loyalty program";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  // Update program
  const updateProgram = useCallback(
    async (programId: string, updates: Partial<LoyaltyProgram>) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("loyalty_programs")
          .update(updates)
          .eq("id", programId)
          .select()
          .single();

        if (updateError) throw updateError;

        setPrograms((prev) =>
          prev.map((p) => (p.id === programId ? data : p))
        );
        return { success: true, program: data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update loyalty program";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Delete program
  const deleteProgram = useCallback(async (programId: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("loyalty_programs")
        .delete()
        .eq("id", programId);

      if (deleteError) throw deleteError;

      setPrograms((prev) => prev.filter((p) => p.id !== programId));
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete loyalty program";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // Get client rewards
  const getClientRewards = useCallback(
    async (clientLinkId: string): Promise<LoyaltyReward[]> => {
      try {
        const { data, error: fetchError } = await supabase
          .from("loyalty_rewards")
          .select("*")
          .eq("client_provider_link_id", clientLinkId)
          .eq("status", "available")
          .order("earned_at", { ascending: false });

        if (fetchError) throw fetchError;
        return data || [];
      } catch (err) {
        console.error("Failed to get client rewards:", err);
        return [];
      }
    },
    []
  );

  // Get client progress
  const getClientProgress = useCallback(
    async (clientLinkId: string, programId: string): Promise<LoyaltyProgress | null> => {
      try {
        const { data, error: fetchError } = await supabase
          .from("loyalty_progress")
          .select("*")
          .eq("client_provider_link_id", clientLinkId)
          .eq("loyalty_program_id", programId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") throw fetchError;
        return data || null;
      } catch (err) {
        console.error("Failed to get client progress:", err);
        return null;
      }
    },
    []
  );

  return {
    programs,
    loading,
    error,
    fetchPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    getClientRewards,
    getClientProgress,
  };
}
