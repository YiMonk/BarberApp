import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Review {
  id: string;
  appointment_id: string;
  provider_account_id: string;
  client_provider_link_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client?: {
    first_name: string;
    last_name?: string;
  };
  appointment?: {
    scheduled_start: string;
  };
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

export function useReviews(providerId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reviews for provider
  const fetchReviews = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("reviews")
        .select(
          `*,
          client:client_provider_link_id(
            client_profile:client_profile_id(first_name, last_name)
          ),
          appointment:appointment_id(scheduled_start)
          `
        )
        .eq("provider_account_id", providerId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data to flatten nested structure
      const transformedData = data?.map((review: any) => ({
        ...review,
        client: review.client?.client_profile,
      })) || [];

      setReviews(transformedData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch reviews";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Create review
  const createReview = useCallback(
    async (
      appointmentId: string,
      clientLinkId: string,
      rating: number,
      comment?: string
    ) => {
      setError(null);

      try {
        const { data, error: insertError } = await supabase
          .from("reviews")
          .insert({
            appointment_id: appointmentId,
            provider_account_id: providerId,
            client_provider_link_id: clientLinkId,
            rating,
            comment: comment || null,
          })
          .select(
            `*,
            client:client_provider_link_id(
              client_profile:client_profile_id(first_name, last_name)
            ),
            appointment:appointment_id(scheduled_start)
            `
          )
          .single();

        if (insertError) throw insertError;

        const transformedReview = {
          ...data,
          client: data.client?.client_profile,
        };

        setReviews((prev) => [transformedReview, ...prev]);
        return { success: true, review: transformedReview };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create review";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  // Delete review
  const deleteReview = useCallback(async (reviewId: string) => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (deleteError) throw deleteError;

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete review";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // Calculate review stats
  const calculateStats = useCallback((reviewList: Review[]): ReviewStats => {
    if (reviewList.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    reviewList.forEach((review) => {
      distribution[review.rating]++;
      totalRating += review.rating;
    });

    return {
      averageRating: parseFloat((totalRating / reviewList.length).toFixed(1)),
      totalReviews: reviewList.length,
      ratingDistribution: distribution,
    };
  }, []);

  return {
    reviews,
    loading,
    error,
    fetchReviews,
    createReview,
    deleteReview,
    calculateStats,
  };
}
