import { useCallback, useState } from "react";

export type SMSType =
  | "appointment_reminder"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "verification_code"
  | "promotional";

export function useSMSNotifications() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSMS = useCallback(
    async (phone: string, message: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, message }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error sending SMS");
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error sending SMS";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendAppointmentReminder = useCallback(
    async (
      phone: string,
      clientName: string,
      providerName: string,
      appointmentTime: string
    ) => {
      const appointmentDate = new Date(appointmentTime);
      const formattedTime = appointmentDate.toLocaleString("es-CL", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const message = `Hola ${clientName}, recordatorio: tu cita con ${providerName} es el ${formattedTime}. 📅`;
      return sendSMS(phone, message);
    },
    [sendSMS]
  );

  const sendConfirmationCode = useCallback(
    async (phone: string, code: string) => {
      const message = `Tu código de verificación es: ${code}. No lo compartas con nadie.`;
      return sendSMS(phone, message);
    },
    [sendSMS]
  );

  const sendPromotionalMessage = useCallback(
    async (phone: string, title: string, message: string, link?: string) => {
      let fullMessage = `${title}: ${message}`;
      if (link) {
        fullMessage += ` ${link}`;
      }
      return sendSMS(phone, fullMessage);
    },
    [sendSMS]
  );

  return {
    loading,
    error,
    sendSMS,
    sendAppointmentReminder,
    sendConfirmationCode,
    sendPromotionalMessage,
  };
}
