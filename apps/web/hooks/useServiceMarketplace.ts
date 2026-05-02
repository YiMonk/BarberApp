import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MarketplaceService {
  id: string;
  provider_id: string;
  provider_name: string;
  category: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutos
  rating: number;
  reviews_count: number;
  image_url?: string;
  tags: string[];
  is_featured: boolean;
  created_at: string;
}

export interface ServiceReview {
  id: string;
  service_id: string;
  client_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  service_count: number;
}

export function useServiceMarketplace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<MarketplaceService[]>([]);

  const searchServices = useCallback(
    async (query: string, filters?: {
      category?: string;
      maxPrice?: number;
      minRating?: number;
    }) => {
      setLoading(true);
      setError(null);

      try {
        let queryBuilder = supabase
          .from("marketplace_services")
          .select("*");

        if (query) {
          queryBuilder = queryBuilder.or(
            `name.ilike.%${query}%,description.ilike.%${query}%`
          );
        }

        if (filters?.category) {
          queryBuilder = queryBuilder.eq("category", filters.category);
        }

        if (filters?.maxPrice) {
          queryBuilder = queryBuilder.lte("price", filters.maxPrice);
        }

        if (filters?.minRating) {
          queryBuilder = queryBuilder.gte("rating", filters.minRating);
        }

        const { data, error: err } = await queryBuilder
          .order("rating", { ascending: false })
          .limit(50);

        if (err) throw err;

        setServices(data || []);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error searching services";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getServiceDetails = useCallback(
    async (serviceId: string) => {
      setLoading(true);

      try {
        const { data: service, error: serviceError } = await supabase
          .from("marketplace_services")
          .select("*")
          .eq("id", serviceId)
          .single();

        if (serviceError) throw serviceError;

        const { data: reviews, error: reviewsError } = await supabase
          .from("service_reviews")
          .select("*")
          .eq("service_id", serviceId)
          .order("created_at", { ascending: false });

        if (reviewsError) throw reviewsError;

        return {
          success: true,
          data: {
            service,
            reviews,
            avgRating:
              reviews && reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching details";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const publishService = useCallback(
    async (serviceData: Omit<MarketplaceService, "id" | "created_at">) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("marketplace_services")
          .insert(serviceData)
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error publishing service";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCategories = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error: err } = await supabase
        .from("service_categories")
        .select("*");

      if (err) throw err;

      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching categories";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const trendingServices = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error: err } = await supabase
        .from("marketplace_services")
        .select("*")
        .eq("is_featured", true)
        .order("rating", { ascending: false })
        .limit(10);

      if (err) throw err;

      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching trending";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    services,
    loading,
    error,
    searchServices,
    getServiceDetails,
    publishService,
    getCategories,
    trendingServices,
  };
}
