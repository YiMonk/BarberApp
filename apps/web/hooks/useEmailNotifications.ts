import { useCallback, useState } from "react";

export interface EmailNotificationPayload {
  to: string;
  subject: string;
  type: "appointment_reminder" | "appointment_confirmed" | "appointment_cancelled" | "review_request";
  data: Record<string, any>;
}

export function useEmailNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = useCallback(async (payload: EmailNotificationPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error sending email");
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error sending email";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const sendAppointmentReminder = useCallback(
    async (
      clientEmail: string,
      clientName: string,
      providerName: string,
      appointmentTime: string,
      hoursUntil: number
    ) => {
      return sendEmail({
        to: clientEmail,
        subject: `Recordatorio: Tu cita con ${providerName} en ${hoursUntil}h`,
        type: "appointment_reminder",
        data: {
          clientName,
          providerName,
          appointmentTime,
          hoursUntil,
        },
      });
    },
    [sendEmail]
  );

  const sendAppointmentConfirmation = useCallback(
    async (
      clientEmail: string,
      clientName: string,
      providerName: string,
      appointmentTime: string
    ) => {
      return sendEmail({
        to: clientEmail,
        subject: `Cita confirmada con ${providerName}`,
        type: "appointment_confirmed",
        data: {
          clientName,
          providerName,
          appointmentTime,
        },
      });
    },
    [sendEmail]
  );

  const sendAppointmentCancellation = useCallback(
    async (
      clientEmail: string,
      clientName: string,
      providerName: string,
      reason?: string
    ) => {
      return sendEmail({
        to: clientEmail,
        subject: `Tu cita con ${providerName} ha sido cancelada`,
        type: "appointment_cancelled",
        data: {
          clientName,
          providerName,
          reason,
        },
      });
    },
    [sendEmail]
  );

  const sendReviewRequest = useCallback(
    async (
      clientEmail: string,
      clientName: string,
      providerName: string,
      appointmentId: string
    ) => {
      return sendEmail({
        to: clientEmail,
        subject: `¿Qué te pareció tu cita con ${providerName}?`,
        type: "review_request",
        data: {
          clientName,
          providerName,
          appointmentId,
        },
      });
    },
    [sendEmail]
  );

  return {
    loading,
    error,
    sendEmail,
    sendAppointmentReminder,
    sendAppointmentConfirmation,
    sendAppointmentCancellation,
    sendReviewRequest,
  };
}
