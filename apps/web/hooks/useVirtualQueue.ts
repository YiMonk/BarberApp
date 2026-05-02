import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface QueueEntry {
  id: string;
  client_id: string;
  position: number;
  estimated_wait_time: number; // minutos
  status: "waiting" | "next" | "in_service" | "completed";
}

export function useVirtualQueue(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  const joinQueue = useCallback(
    async (clientId: string) => {
      if (!providerId) return { success: false };

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("virtual_queues")
          .insert({
            provider_id: providerId,
            client_id: clientId,
            status: "waiting",
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const getQueueStatus = useCallback(async () => {
    if (!providerId) return { success: false };

    try {
      const { data, error } = await supabase
        .from("virtual_queues")
        .select("*")
        .eq("provider_id", providerId)
        .eq("status", "waiting")
        .order("created_at");

      if (error) throw error;

      const updatedQueue = data?.map((entry, index) => ({
        ...entry,
        position: index + 1,
        estimated_wait_time: (index + 1) * 15,
      })) || [];

      setQueue(updatedQueue);
      return { success: true, data: updatedQueue };
    } catch (err) {
      return { success: false };
    }
  }, [providerId]);

  return { queue, loading, joinQueue, getQueueStatus };
}
