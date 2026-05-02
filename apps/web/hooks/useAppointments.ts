import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AppointmentStatus =
  | "draft"
  | "pending_provider_approval"
  | "pending_client_approval"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "attended"
  | "no_show";

export interface Appointment {
  id: string;
  provider_account_id: string;
  client_provider_link_id: string;
  status: AppointmentStatus;
  scheduled_start: string;
  scheduled_end: string;
  is_walk_in: boolean;
  notes?: string;
  created_by_role: "provider" | "client";
  approval_expires_at?: string;
  cancelled_by?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  attended_at?: string;
  created_at: string;
  updated_at: string;
}

export function useAppointments(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const fetchAppointments = useCallback(
    async (filters?: { status?: AppointmentStatus; clientId?: string }) => {
      if (!providerId) return;
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("appointments")
          .select("*")
          .eq("provider_account_id", providerId);

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.clientId) {
          query = query.eq("client_provider_link_id", filters.clientId);
        }

        const { data, error: fetchError } = await query.order("scheduled_start", {
          ascending: false,
        });

        if (fetchError) throw fetchError;
        setAppointments(data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch appointments";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const createAppointment = useCallback(
    async (data: {
      clientLinkId: string;
      startTime: string; // ISO string
      endTime: string; // ISO string
      serviceIds: string[];
      notes?: string;
      isWalkIn?: boolean;
      createdByRole: "provider" | "client";
    }) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        // Validar que no haya solapamiento
        const { data: overlapping, error: overlapError } = await supabase
          .from("appointments")
          .select("*")
          .eq("provider_account_id", providerId)
          .neq("status", "cancelled")
          .lt("scheduled_start", data.endTime)
          .gt("scheduled_end", data.startTime);

        if (overlapError) throw overlapError;
        if (overlapping && overlapping.length > 0) {
          return {
            success: false,
            error: "Time slot is already booked. Please choose another time.",
          };
        }

        // Determinar status basado en creador
        const status: AppointmentStatus =
          data.createdByRole === "provider"
            ? data.isWalkIn
              ? "confirmed"
              : "pending_client_approval"
            : "pending_provider_approval";

        // Crear cita
        const { data: appointment, error: createError } = await supabase
          .from("appointments")
          .insert({
            provider_account_id: providerId,
            client_provider_link_id: data.clientLinkId,
            status,
            scheduled_start: data.startTime,
            scheduled_end: data.endTime,
            is_walk_in: data.isWalkIn || false,
            notes: data.notes,
            created_by_role: data.createdByRole,
            approval_expires_at:
              status === "pending_provider_approval"
                ? new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 horas
                : status === "pending_client_approval"
                  ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
                  : null,
          })
          .select()
          .single();

        if (createError) throw createError;

        // Agregar servicios
        if (data.serviceIds.length > 0) {
          const serviceRecords = data.serviceIds.map((serviceId, index) => ({
            appointment_id: appointment.id,
            service_id: serviceId,
            display_order: index,
          }));

          const { error: servicesError } = await supabase
            .from("appointment_services")
            .insert(serviceRecords);

          if (servicesError) throw servicesError;
        }

        setAppointments((prev) => [appointment, ...prev]);
        return { success: true, appointment };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create appointment";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  const approveAppointment = useCallback(
    async (appointmentId: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", appointmentId)
          .select()
          .single();

        if (updateError) throw updateError;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data : a))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to approve appointment";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const rejectAppointment = useCallback(
    async (appointmentId: string, reason?: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_by: "provider",
            cancellation_reason: reason || "rejected_by_provider",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (updateError) throw updateError;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data : a))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reject appointment";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const cancelAppointment = useCallback(
    async (appointmentId: string, reason?: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_by: "provider",
            cancellation_reason: reason,
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (updateError) throw updateError;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data : a))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to cancel appointment";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const markAttended = useCallback(
    async (appointmentId: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointments")
          .update({
            status: "attended",
            attended_at: new Date().toISOString(),
          })
          .eq("id", appointmentId)
          .select()
          .single();

        if (updateError) throw updateError;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data : a))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark attended";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const markNoShow = useCallback(
    async (appointmentId: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointments")
          .update({ status: "no_show" })
          .eq("id", appointmentId)
          .select()
          .single();

        if (updateError) throw updateError;

        setAppointments((prev) =>
          prev.map((a) => (a.id === appointmentId ? data : a))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark no-show";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    approveAppointment,
    rejectAppointment,
    cancelAppointment,
    markAttended,
    markNoShow,
  };
}
