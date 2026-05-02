import { useCallback, useState } from "react";

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  payment_method: string;
  created_at: string;
  updated_at: string;
}

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(
    async (appointmentId: string, amount: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            amount,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create payment intent");
        }

        const data = await response.json();
        return { success: true, clientSecret: data.clientSecret };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating payment";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const confirmPayment = useCallback(
    async (paymentIntentId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/confirm-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId }),
        });

        if (!response.ok) {
          throw new Error("Failed to confirm payment");
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error confirming payment";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refundPayment = useCallback(
    async (paymentId: string, amount?: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/refund-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId, amount }),
        });

        if (!response.ok) {
          throw new Error("Failed to refund payment");
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error refunding payment";
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
    createPaymentIntent,
    confirmPayment,
    refundPayment,
  };
}
