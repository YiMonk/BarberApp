import { useCallback, useState } from "react";

export interface WhatsAppTemplate {
  id: string;
  provider_account_id: string;
  type: "appointment_reminder" | "appointment_confirmation" | "greeting" | "custom";
  name: string;
  content: string;
  variables: string[]; // e.g., ["cliente_nombre", "fecha", "hora"]
  active: boolean;
  created_at: string;
}

export function useWhatsApp(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);

  const getDefaultTemplate = (type: WhatsAppTemplate["type"]): string => {
    const templates: Record<string, string> = {
      appointment_reminder: `Hola {{cliente_nombre}}, te recordamos tu cita el {{fecha}} a las {{hora}} con {{proveedor_nombre}}. 📅`,
      appointment_confirmation: `¡Cita confirmada! {{cliente_nombre}}, te veremos el {{fecha}} a las {{hora}}. 🎉`,
      greeting: `Hola {{cliente_nombre}}, ¿cómo estás? 👋 Aquí {{proveedor_nombre}}`,
      custom: `Tu mensaje personalizado aquí`,
    };
    return templates[type] || "";
  };

  const sendMessage = useCallback(
    async (
      phone: string,
      message: string,
      variables?: Record<string, string>
    ) => {
      setLoading(true);
      setError(null);

      try {
        // Reemplazar variables en el mensaje
        let finalMessage = message;
        if (variables) {
          Object.entries(variables).forEach(([key, value]) => {
            finalMessage = finalMessage.replace(`{{${key}}}`, value);
          });
        }

        const response = await fetch("/api/send-whatsapp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone,
            message: finalMessage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error sending WhatsApp message");
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error sending message";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const sendReminderMessage = useCallback(
    async (
      phone: string,
      clientName: string,
      providerName: string,
      appointmentDate: string,
      appointmentTime: string
    ) => {
      const message = `Hola ${clientName}, te recordamos tu cita el ${appointmentDate} a las ${appointmentTime} con ${providerName}. 📅`;
      return sendMessage(phone, message);
    },
    [sendMessage]
  );

  const sendConfirmationMessage = useCallback(
    async (
      phone: string,
      clientName: string,
      providerName: string,
      appointmentDate: string,
      appointmentTime: string
    ) => {
      const message = `¡Cita confirmada! ${clientName}, te veremos el ${appointmentDate} a las ${appointmentTime} con ${providerName}. 🎉`;
      return sendMessage(phone, message);
    },
    [sendMessage]
  );

  const generateWhatsAppLink = useCallback(
    (phone: string, message: string) => {
      const encodedMessage = encodeURIComponent(message);
      return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodedMessage}`;
    },
    []
  );

  return {
    loading,
    error,
    templates,
    sendMessage,
    sendReminderMessage,
    sendConfirmationMessage,
    generateWhatsAppLink,
    getDefaultTemplate,
  };
}
