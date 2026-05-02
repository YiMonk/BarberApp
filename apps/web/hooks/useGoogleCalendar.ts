import { useCallback, useState } from "react";

export interface GoogleCalendarConfig {
  provider_id: string;
  calendar_id: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  sync_enabled: boolean;
}

export function useGoogleCalendar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const getAuthUrl = useCallback((clientId: string, redirectUri: string) => {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, []);

  const exchangeCodeForToken = useCallback(
    async (
      code: string,
      clientId: string,
      clientSecret: string,
      redirectUri: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-calendar/exchange-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            clientId,
            clientSecret,
            redirectUri,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to exchange code for token");
        }

        const data = await response.json();
        setIsConnected(true);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error exchanging token";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const syncAppointmentToGoogle = useCallback(
    async (appointmentId: string, appointmentData: any) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-calendar/sync-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId,
            appointment: appointmentData,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to sync appointment");
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error syncing appointment";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removeAppointmentFromGoogle = useCallback(
    async (googleEventId: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-calendar/delete-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: googleEventId }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete event");
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting event";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getAvailableSlots = useCallback(
    async (providerId: string, date: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/google-calendar/available-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId, date }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch available slots");
        }

        const data = await response.json();
        return { success: true, slots: data.slots };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching slots";
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
    isConnected,
    getAuthUrl,
    exchangeCodeForToken,
    syncAppointmentToGoogle,
    removeAppointmentFromGoogle,
    getAvailableSlots,
  };
}
