import { useCallback, useState } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function useAISupport() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (userMessage: string) => {
    setLoading(true);
    setError(null);

    try {
      // Agregar mensaje del usuario
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Enviar al API
      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      // Agregar respuesta del asistente
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      return { success: true, response: data.response };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error sending message";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const suggestedQuestions = [
    "¿Cómo creo una nueva cita?",
    "¿Cómo gestiono mis horarios?",
    "¿Cómo puedo ver mis ingresos?",
    "¿Cómo edito un servicio?",
    "¿Cómo configuro la lealtad de clientes?",
    "¿Dónde está mi lista de espera?",
  ];

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearChat,
    suggestedQuestions,
  };
}
