import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signUp = useCallback(
    async (email: string, password: string, businessName: string) => {
      setLoading(true);
      setError(null);

      try {
        // 1. Registrar usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("User creation failed");

        // 2. Crear provider_accounts
        const { error: providerError } = await supabase
          .from("provider_accounts")
          .insert({
            id: authData.user.id,
            auth_user_id: authData.user.id,
            business_name: businessName,
            email,
            onboarding_completed: false,
            is_active: true,
          });

        if (providerError) throw providerError;

        // 3. La suscripción trial se crea automáticamente vía trigger

        return { success: true, userId: authData.user.id };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Registration failed";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      return { success: true, user: data.user };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Logout failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    signUp,
    signIn,
    signOut,
    loading,
    error,
  };
}
