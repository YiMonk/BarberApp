import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AnalyticsData {
  totalAppointments: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  attendedAppointments: number;
  averageRating: number;
  totalReviews: number;
  activeClients: number;
  totalClients: number;
  loyaltyProgramsCount: number;
  totalLoyaltyRewards: number;
  appointmentsByMonth: Array<{ month: string; count: number }>;
  topServices: Array<{ name: string; count: number }>;
}

export function useAnalytics(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);
    setError(null);

    try {
      // Fetch appointments stats
      const { data: appointments } = await supabase
        .from("appointments")
        .select("status")
        .eq("provider_account_id", providerId);

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_account_id", providerId);

      // Fetch client links (active clients)
      const { data: clientLinks } = await supabase
        .from("client_provider_links")
        .select("*")
        .eq("provider_account_id", providerId);

      // Fetch loyalty programs
      const { data: loyaltyPrograms } = await supabase
        .from("loyalty_programs")
        .select("*")
        .eq("provider_account_id", providerId);

      // Fetch loyalty rewards
      const { data: loyaltyRewards } = await supabase
        .from("loyalty_rewards")
        .select("*")
        .in(
          "loyalty_progress.loyalty_program_id",
          loyaltyPrograms?.map((p) => p.id) || []
        );

      // Calculate stats
      const appointmentStats = {
        total: appointments?.length || 0,
        confirmed: appointments?.filter((a) => a.status === "confirmed").length || 0,
        cancelled: appointments?.filter((a) => a.status === "cancelled").length || 0,
        noShow: appointments?.filter((a) => a.status === "no_show").length || 0,
        attended: appointments?.filter((a) => a.status === "attended").length || 0,
      };

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

      const analyticsData: AnalyticsData = {
        totalAppointments: appointmentStats.total,
        confirmedAppointments: appointmentStats.confirmed,
        cancelledAppointments: appointmentStats.cancelled,
        noShowAppointments: appointmentStats.noShow,
        attendedAppointments: appointmentStats.attended,
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews: reviews?.length || 0,
        activeClients: clientLinks?.length || 0,
        totalClients: clientLinks?.length || 0,
        loyaltyProgramsCount: loyaltyPrograms?.length || 0,
        totalLoyaltyRewards: loyaltyRewards?.length || 0,
        appointmentsByMonth: [],
        topServices: [],
      };

      setAnalytics(analyticsData);
      return { success: true, data: analyticsData };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching analytics";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
}
