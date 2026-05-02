import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ReferralProgram {
  id: string;
  provider_account_id: string;
  name: string;
  description: string;
  referrer_reward: number; // monto a dar al referente
  referee_reward: number; // monto/descuento a dar al referido
  reward_type: "discount" | "credit"; // qué tipo de recompensa
  max_referrals?: number;
  expiry_days: number;
  active: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referral_program_id: string;
  referrer_id: string;
  referee_id: string;
  referral_code: string;
  status: "pending" | "completed" | "expired";
  created_at: string;
  completed_at?: string;
}

export function useReferrals(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReferralProgram = useCallback(
    async (programData: Omit<ReferralProgram, "id" | "created_at">) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("referral_programs")
          .insert({
            ...programData,
            provider_account_id: providerId,
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error creating referral program";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const generateReferralCode = useCallback((): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  const createReferral = useCallback(
    async (
      programId: string,
      referrerId: string,
      refereeId: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const code = generateReferralCode();

        const { data, error: err } = await supabase
          .from("referrals")
          .insert({
            referral_program_id: programId,
            referrer_id: referrerId,
            referee_id: refereeId,
            referral_code: code,
            status: "pending",
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating referral";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [generateReferralCode]
  );

  const completeReferral = useCallback(
    async (referralId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("referrals")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", referralId)
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error completing referral";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getReferralStats = useCallback(
    async (programId: string) => {
      setLoading(true);

      try {
        const { data, error: err } = await supabase
          .from("referrals")
          .select("*")
          .eq("referral_program_id", programId);

        if (err) throw err;

        const stats = {
          total: data?.length || 0,
          pending: data?.filter((r) => r.status === "pending").length || 0,
          completed: data?.filter((r) => r.status === "completed").length || 0,
          expired: data?.filter((r) => r.status === "expired").length || 0,
        };

        return { success: true, stats };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching stats";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createReferralProgram,
    generateReferralCode,
    createReferral,
    completeReferral,
    getReferralStats,
  };
}
