import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type NotificationChannel = "push" | "email" | "sms" | "whatsapp";
export type NotificationTiming = "immediate" | "delayed" | "optimal";

export interface SmartNotification {
  id: string;
  appointment_id: string;
  client_id: string;
  type: string;
  channels: NotificationChannel[];
  timing: NotificationTiming;
  scheduled_for: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  created_at: string;
}

export function useSmartNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleSmartNotification = useCallback(
    async (
      appointmentId: string,
      clientId: string,
      type: string,
      channels: NotificationChannel[],
      timing: NotificationTiming = "optimal"
    ) => {
      setLoading(true);
      setError(null);

      try {
        // Calcular tiempo óptimo si se solicita
        let scheduledFor = new Date().toISOString();

        if (timing === "delayed") {
          // 24 horas antes
          const delayedTime = new Date();
          delayedTime.setHours(delayedTime.getHours() + 24);
          scheduledFor = delayedTime.toISOString();
        } else if (timing === "optimal") {
          // Usar IA simple para encontrar mejor momento (ej: 10am)
          const optimalTime = new Date();
          optimalTime.setHours(10, 0, 0, 0);
          if (optimalTime < new Date()) {
            optimalTime.setDate(optimalTime.getDate() + 1);
          }
          scheduledFor = optimalTime.toISOString();
        }

        const { data, error: err } = await supabase
          .from("smart_notifications")
          .insert({
            appointment_id: appointmentId,
            client_id: clientId,
            type,
            channels,
            timing,
            scheduled_for: scheduledFor,
            status: "pending",
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error scheduling notification";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const optimizeNotificationTime = useCallback(
    async (
      appointmentTime: string,
      clientTimezone: string = "America/Santiago"
    ): Promise<Date> => {
      // En producción, análizar patrones de engagement del cliente
      const appointmentDate = new Date(appointmentTime);
      const reminderTime = new Date(appointmentDate);
      reminderTime.setHours(reminderTime.getHours() - 24, 10, 0, 0);

      return reminderTime;
    },
    []
  );

  const selectBestChannels = useCallback(
    async (clientId: string, messageType: string): Promise<NotificationChannel[]> => {
      // Análizar historial de engagement del cliente
      try {
        const { data } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("client_id", clientId)
          .single();

        if (!data) {
          return ["push", "email"]; // Default channels
        }

        const channels: NotificationChannel[] = [];

        if (data.push_enabled) channels.push("push");
        if (data.email_enabled) channels.push("email");
        if (data.sms_enabled) channels.push("sms");
        if (data.whatsapp_enabled) channels.push("whatsapp");

        return channels.length > 0 ? channels : ["email"];
      } catch {
        return ["push", "email"];
      }
    },
    []
  );

  const cancelNotification = useCallback(
    async (notificationId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: err } = await supabase
          .from("smart_notifications")
          .update({ status: "cancelled" })
          .eq("id", notificationId);

        if (err) throw err;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error cancelling notification";
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
    scheduleSmartNotification,
    optimizeNotificationTime,
    selectBestChannels,
    cancelNotification,
  };
}
