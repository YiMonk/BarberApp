import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface WaitlistEntry {
  id: string;
  provider_account_id: string;
  client_provider_link_id: string;
  desired_date: string;
  desired_time_start?: string;
  desired_time_end?: string;
  service_ids: string[];
  priority: number;
  status: "waiting" | "notified" | "converted" | "expired" | "cancelled";
  notified_at?: string;
  notification_expires_at?: string;
  offered_appointment_id?: string;
  created_at: string;
  client?: {
    first_name: string;
    last_name?: string;
    phone?: string;
  };
}

export function useWaitlist(providerId: string | null) {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch waitlist entries
  const fetchEntries = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("waitlist_entries")
        .select(
          `*,
          client:client_provider_link_id(
            client_profile:client_profile_id(first_name, last_name, phone)
          )
          `
        )
        .eq("provider_account_id", providerId)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      // Transform data to flatten nested structure
      const transformedData = data?.map((entry: any) => ({
        ...entry,
        client: entry.client?.client_profile,
      })) || [];

      setEntries(transformedData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch waitlist entries";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Add to waitlist
  const addToWaitlist = useCallback(
    async (
      clientLinkId: string,
      desiredDate: string,
      serviceIds: string[],
      desiredTimeStart?: string,
      desiredTimeEnd?: string,
      priority?: number
    ) => {
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from("waitlist_entries")
          .insert({
            provider_account_id: providerId,
            client_provider_link_id: clientLinkId,
            desired_date: desiredDate,
            desired_time_start: desiredTimeStart || null,
            desired_time_end: desiredTimeEnd || null,
            service_ids: serviceIds,
            priority: priority || 0,
          })
          .select(
            `*,
            client:client_provider_link_id(
              client_profile:client_profile_id(first_name, last_name, phone)
            )
            `
          )
          .single();

        if (insertError) throw insertError;

        const transformedEntry = {
          ...data,
          client: data.client?.client_profile,
        };

        setEntries((prev) => [transformedEntry, ...prev]);
        return { success: true, entry: transformedEntry };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add to waitlist";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  // Cancel waitlist entry
  const cancelEntry = useCallback(async (entryId: string) => {
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .from("waitlist_entries")
        .update({ status: "cancelled" })
        .eq("id", entryId)
        .select()
        .single();

      if (updateError) throw updateError;

      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? data : e))
      );
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel waitlist entry";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    entries,
    loading,
    error,
    fetchEntries,
    addToWaitlist,
    cancelEntry,
  };
}
