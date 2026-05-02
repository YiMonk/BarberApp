import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface PublicProvider {
  id: string;
  business_name: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  onboarding_completed: boolean;
  created_at: string;
}

export interface ProviderWithDetails extends PublicProvider {
  services?: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  }>;
  averageRating?: number;
  totalReviews?: number;
}

export function usePublicProviders() {
  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all public providers
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("provider_accounts")
        .select("id, business_name, display_name, bio, avatar_url, phone, email, timezone, onboarding_completed, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setProviders(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch providers";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get provider details (services + reviews)
  const getProviderDetails = useCallback(
    async (providerId: string): Promise<ProviderWithDetails | null> => {
      try {
        const provider = providers.find((p) => p.id === providerId);
        if (!provider) return null;

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name, duration_minutes, price")
          .eq("provider_account_id", providerId)
          .order("display_order");

        if (servicesError) throw servicesError;

        // Fetch reviews and calculate stats
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_account_id", providerId);

        if (reviewsError) throw reviewsError;

        let averageRating = 0;
        let totalReviews = 0;

        if (reviewsData && reviewsData.length > 0) {
          totalReviews = reviewsData.length;
          const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0);
          averageRating = parseFloat((sum / totalReviews).toFixed(1));
        }

        return {
          ...provider,
          services: servicesData || [],
          averageRating,
          totalReviews,
        };
      } catch (err) {
        console.error("Failed to get provider details:", err);
        return null;
      }
    },
    [providers]
  );

  return {
    providers,
    loading,
    error,
    fetchProviders,
    getProviderDetails,
  };
}
