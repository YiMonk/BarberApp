import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface WeeklyAvailability {
  id: string;
  provider_account_id: string;
  day_of_week: number; // 0-6 (Monday-Sunday)
  start_time: string; // HH:MM:SS
  end_time: string;
  is_available: boolean;
}

export interface AvailabilityOverride {
  id: string;
  provider_account_id: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  reason: string;
  is_available: boolean;
}

export function useSchedule(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyAvailability[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);

  const fetchSchedule = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const [weeklyRes, overridesRes] = await Promise.all([
        supabase
          .from("weekly_availability")
          .select("*")
          .eq("provider_account_id", providerId)
          .order("day_of_week"),
        supabase
          .from("availability_overrides")
          .select("*")
          .eq("provider_account_id", providerId)
          .order("date"),
      ]);

      if (weeklyRes.error) throw weeklyRes.error;
      if (overridesRes.error) throw overridesRes.error;

      setWeeklySchedule(weeklyRes.data || []);
      setOverrides(overridesRes.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch schedule";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const updateWeeklyAvailability = useCallback(
    async (dayOfWeek: number, startTime: string, endTime: string) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        const existing = weeklySchedule.find((s) => s.day_of_week === dayOfWeek);

        if (existing) {
          const { data, error: updateError } = await supabase
            .from("weekly_availability")
            .update({
              start_time: startTime,
              end_time: endTime,
              is_available: true,
            })
            .eq("id", existing.id)
            .select()
            .single();

          if (updateError) throw updateError;

          setWeeklySchedule((prev) =>
            prev.map((s) => (s.day_of_week === dayOfWeek ? data : s))
          );
        } else {
          const { data, error: insertError } = await supabase
            .from("weekly_availability")
            .insert({
              provider_account_id: providerId,
              day_of_week: dayOfWeek,
              start_time: startTime,
              end_time: endTime,
              is_available: true,
            })
            .select()
            .single();

          if (insertError) throw insertError;

          setWeeklySchedule((prev) => [...prev, data]);
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update schedule";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId, weeklySchedule]
  );

  const addOverride = useCallback(
    async (date: string, startTime: string, endTime: string, reason: string) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        const { data, error: insertError } = await supabase
          .from("availability_overrides")
          .insert({
            provider_account_id: providerId,
            date,
            start_time: startTime,
            end_time: endTime,
            reason,
            is_available: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setOverrides((prev) => [...prev, data]);
        return { success: true, override: data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add override";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  const deleteOverride = useCallback(async (id: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("availability_overrides")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setOverrides((prev) => prev.filter((o) => o.id !== id));
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete override";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    weeklySchedule,
    overrides,
    loading,
    error,
    fetchSchedule,
    updateWeeklyAvailability,
    addOverride,
    deleteOverride,
  };
}
