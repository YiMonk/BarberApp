import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Feedback {
  id: string;
  client_id: string;
  provider_id: string;
  rating: number; // 1-5
  category: "service" | "staff" | "facility" | "price" | "other";
  comment: string;
  would_recommend: boolean;
  created_at: string;
}

export function useCustomerFeedback(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitFeedback = useCallback(
    async (
      clientId: string,
      rating: number,
      category: Feedback["category"],
      comment: string,
      wouldRecommend: boolean
    ) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("customer_feedback")
          .insert({
            client_id: clientId,
            provider_id: providerId,
            rating,
            category,
            comment,
            would_recommend: wouldRecommend,
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error submitting feedback";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const getFeedbackSummary = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);

    try {
      const { data, error: err } = await supabase
        .from("customer_feedback")
        .select("*")
        .eq("provider_id", providerId);

      if (err) throw err;

      const feedbackData = data || [];
      const avgRating =
        feedbackData.length > 0
          ? feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length
          : 0;

      const recommendationRate =
        feedbackData.length > 0
          ? (feedbackData.filter((f) => f.would_recommend).length / feedbackData.length) * 100
          : 0;

      return {
        success: true,
        data: {
          totalFeedback: feedbackData.length,
          averageRating: Math.round(avgRating * 10) / 10,
          recommendationRate: Math.round(recommendationRate),
          byCategory: {
            service: feedbackData.filter((f) => f.category === "service").length,
            staff: feedbackData.filter((f) => f.category === "staff").length,
            facility: feedbackData.filter((f) => f.category === "facility").length,
            price: feedbackData.filter((f) => f.category === "price").length,
          },
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching summary";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return {
    loading,
    error,
    submitFeedback,
    getFeedbackSummary,
  };
}
