import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  avatar_url?: string;
  preferred_notification_method?: "push" | "email" | "sms";
  created_at: string;
  updated_at: string;
}

export function useClientProfile(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return { success: false, error: "No user ID" };

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("client_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (err) {
        if (err.code === "PGRST116") {
          // No profile found, create one
          const result = await createProfile(userId);
          if (result.success) {
            setProfile(result.data);
          }
          return result;
        }
        throw err;
      }

      setProfile(data as ClientProfile);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching profile";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const createProfile = useCallback(
    async (user_id: string) => {
      setLoading(true);
      setError(null);

      try {
        const { data: authUser } = await supabase.auth.getUser();

        const { data, error: err } = await supabase
          .from("client_profiles")
          .insert({
            user_id,
            full_name: authUser?.user?.user_metadata?.full_name || "",
            email: authUser?.user?.email || "",
          })
          .select()
          .single();

        if (err) throw err;

        setProfile(data as ClientProfile);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating profile";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateProfile = useCallback(
    async (updates: Partial<ClientProfile>) => {
      if (!profile?.id) return { success: false, error: "No profile ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("client_profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id)
          .select()
          .single();

        if (err) throw err;

        setProfile(data as ClientProfile);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating profile";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [profile?.id]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!profile?.id) return { success: false, error: "No profile ID" };

      setLoading(true);
      setError(null);

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${profile.id}-avatar.${fileExt}`;
        const filePath = `avatars/${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("client-avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("client-avatars")
          .getPublicUrl(filePath);

        const updateResult = await updateProfile({
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
    [profile?.id, updateProfile]
  );

  return {
    profile,
    loading,
    error,
    fetchProfile,
    createProfile,
    updateProfile,
    uploadAvatar,
  };
}
