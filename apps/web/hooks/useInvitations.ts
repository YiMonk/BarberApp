import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type InvitationStatus = "pending" | "opened" | "accepted" | "rejected" | "expired" | "cancelled";

export interface AppointmentInvitation {
  id: string;
  appointment_id: string;
  provider_account_id: string;
  token: string;
  sent_to_name: string;
  sent_to_phone?: string;
  sent_to_email?: string;
  sent_via: "whatsapp" | "sms" | "email" | "manual";
  status: InvitationStatus;
  sent_at: string;
  opened_at?: string;
  responded_at?: string;
  expires_at: string;
  resulted_in_user_id?: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

export function useInvitations(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<AppointmentInvitation[]>([]);

  const fetchInvitations = useCallback(
    async (filters?: { status?: InvitationStatus; appointmentId?: string }) => {
      if (!providerId) return;
      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("appointment_invitations")
          .select("*")
          .eq("provider_account_id", providerId);

        if (filters?.status) {
          query = query.eq("status", filters.status);
        }
        if (filters?.appointmentId) {
          query = query.eq("appointment_id", filters.appointmentId);
        }

        const { data, error: fetchError } = await query.order("sent_at", {
          ascending: false,
        });

        if (fetchError) throw fetchError;
        setInvitations(data || []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch invitations";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const sendInvitation = useCallback(
    async (data: {
      appointmentId: string;
      clientId: string;
      sentToName: string;
      sentToPhone?: string;
      sentToEmail?: string;
      sentVia: "whatsapp" | "sms" | "email" | "manual";
    }) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        // Generar token único
        const token = Math.random().toString(36).substring(2, 34);

        const { data: invitation, error: createError } = await supabase
          .from("appointment_invitations")
          .insert({
            appointment_id: data.appointmentId,
            provider_account_id: providerId,
            token,
            sent_to_name: data.sentToName,
            sent_to_phone: data.sentToPhone,
            sent_to_email: data.sentToEmail,
            sent_via: data.sentVia,
            status: "pending",
            client_id: data.clientId,
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días
          })
          .select()
          .single();

        if (createError) throw createError;

        setInvitations((prev) => [invitation, ...prev]);
        return {
          success: true,
          invitation,
          publicUrl: `/confirm-appointment/${token}`,
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to send invitation";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  const acceptInvitation = useCallback(
    async (token: string, userId?: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointment_invitations")
          .update({
            status: "accepted",
            responded_at: new Date().toISOString(),
            resulted_in_user_id: userId,
          })
          .eq("token", token)
          .select()
          .single();

        if (updateError) throw updateError;

        setInvitations((prev) =>
          prev.map((inv) => (inv.token === token ? data : inv))
        );

        // Actualizar status de cita a confirmed
        await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", data.appointment_id);

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to accept invitation";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const rejectInvitation = useCallback(
    async (token: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("appointment_invitations")
          .update({
            status: "rejected",
            responded_at: new Date().toISOString(),
          })
          .eq("token", token)
          .select()
          .single();

        if (updateError) throw updateError;

        setInvitations((prev) =>
          prev.map((inv) => (inv.token === token ? data : inv))
        );

        // Cancelar cita
        await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_by: "client",
            cancellation_reason: "rejected_invitation",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", data.appointment_id);

        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to reject invitation";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const getInvitationByToken = useCallback(
    async (token: string) => {
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("appointment_invitations")
          .select(
            `*,
            appointment:appointment_id(
              *,
              services:appointment_services(
                *,
                service:service_id(*)
              )
            ),
            client:client_id(*),
            provider:provider_account_id(*)
          `
          )
          .eq("token", token)
          .single();

        if (fetchError) throw fetchError;

        return { success: true, data };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invitation not found";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    acceptInvitation,
    rejectInvitation,
    getInvitationByToken,
  };
}
