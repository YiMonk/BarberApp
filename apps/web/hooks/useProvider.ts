import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ProviderAccount {
  id: string;
  business_name: string;
  display_name?: string;
  email: string;
  phone?: string;
  whatsapp_number?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  google_maps_url?: string;
  onboarding_completed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useProvider(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<ProviderAccount | null>(null);

  const fetchProvider = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("*")
        .eq("id", providerId)
        .single();

      if (err) throw err;

      setProvider(data as ProviderAccount);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching provider";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const updateProvider = useCallback(
    async (updates: Partial<ProviderAccount>) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("provider_accounts")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", providerId)
          .select()
          .single();

        if (err) throw err;

        setProvider(data as ProviderAccount);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating provider";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${providerId}-avatar.${fileExt}`;
        const filePath = `avatars/${providerId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("provider-avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("provider-avatars")
          .getPublicUrl(filePath);

        const updateResult = await updateProvider({
          avatar_url: urlData.publicUrl,
        });

        return updateResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error uploading avatar";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId, updateProvider]
  );

  return {
    provider,
    loading,
    error,
    fetchProvider,
    updateProvider,
    uploadAvatar,
  };
}
