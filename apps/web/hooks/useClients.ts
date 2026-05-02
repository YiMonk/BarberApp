import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ClientProfile {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  birth_date?: string;
  is_registered: boolean;
  created_at: string;
}

export interface ClientProviderLink {
  id: string;
  client_profile_id: string;
  provider_account_id: string;
  internal_notes?: string;
  source: "self_registration" | "manual_creation" | "invitation_accepted" | "imported";
  whatsapp_reminders_enabled: boolean;
  total_appointments: number;
  total_attended: number;
  total_no_show: number;
  last_appointment_at?: string;
  first_appointment_at?: string;
  converted_at?: string;
  created_at: string;
}

export interface ClientWithLink extends ClientProviderLink {
  client: ClientProfile;
}

export function useClients(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientWithLink[]>([]);

  const fetchClients = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("client_provider_links")
        .select(
          `*,
          client:client_profile_id(*)
        `
        )
        .eq("provider_account_id", providerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setClients(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch clients";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const createClient = useCallback(
    async (
      firstName: string,
      phone?: string,
      email?: string,
      lastNameOrWhatsapp?: string,
      notes?: string
    ) => {
      setError(null);

      try {
        if (!providerId) throw new Error("Provider ID required");

        // Crear o encontrar client_profile
        const { data: existingProfile, error: searchError } = await supabase
          .from("client_profiles")
          .select("id")
          .eq("first_name", firstName)
          .eq("phone", phone || null)
          .single();

        let clientProfileId: string;

        if (existingProfile && !searchError) {
          clientProfileId = existingProfile.id;
        } else {
          const { data: newProfile, error: createError } = await supabase
            .from("client_profiles")
            .insert({
              first_name: firstName,
              last_name: lastNameOrWhatsapp,
              phone,
              email,
              is_registered: false,
            })
            .select()
            .single();

          if (createError) throw createError;
          clientProfileId = newProfile.id;
        }

        // Crear link
        const { data: link, error: linkError } = await supabase
          .from("client_provider_links")
          .insert({
            client_profile_id: clientProfileId,
            provider_account_id: providerId,
            source: "manual_creation",
            internal_notes: notes,
            whatsapp_reminders_enabled: true,
          })
          .select(
            `*,
            client:client_profile_id(*)
          `
          )
          .single();

        if (linkError) throw linkError;

        setClients((prev) => [link, ...prev]);
        return { success: true, client: link };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create client";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  const updateClientNotes = useCallback(
    async (linkId: string, notes: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("client_provider_links")
          .update({ internal_notes: notes })
          .eq("id", linkId)
          .select(
            `*,
            client:client_profile_id(*)
          `
          )
          .single();

        if (updateError) throw updateError;

        setClients((prev) =>
          prev.map((c) => (c.id === linkId ? data : c))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update notes";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  const toggleWhatsappReminders = useCallback(
    async (linkId: string, enabled: boolean) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("client_provider_links")
          .update({ whatsapp_reminders_enabled: enabled })
          .eq("id", linkId)
          .select(
            `*,
            client:client_profile_id(*)
          `
          )
          .single();

        if (updateError) throw updateError;

        setClients((prev) =>
          prev.map((c) => (c.id === linkId ? data : c))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update preferences";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  return {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClientNotes,
    toggleWhatsappReminders,
  };
}
