import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface SLA {
  id: string;
  provider_id: string;
  name: string;
  description: string;
  response_time_hours: number; // responder dentro de X horas
  completion_rate_target: number; // % de citas completadas
  quality_score_target: number; // puntuación mínima
  cancellation_rate_max: number; // máximo % de cancelaciones
  penalties?: {
    missed_response: number; // $ de penalidad
    poor_quality: number;
  };
  active: boolean;
  created_at: string;
}

export interface SLAMetrics {
  provider_id: string;
  month: string;
  response_time_avg: number;
  completion_rate: number;
  quality_score: number;
  cancellation_rate: number;
  sla_compliance: boolean;
  penalty_applied?: number;
}

export function useSLA(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null);

  const createSLA = useCallback(
    async (slaData: Omit<SLA, "id" | "created_at">) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("slas")
          .insert({
            ...slaData,
            provider_id: providerId,
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating SLA";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const calculateMetrics = useCallback(
    async (month: string) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        // Obtener citas del mes
        const startDate = `${month}-01`;
        const endDate = new Date(month + "-01");
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split("T")[0];

        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("*")
          .eq("provider_account_id", providerId)
          .gte("created_at", startDate)
          .lte("created_at", endDateStr);

        if (appointmentsError) throw appointmentsError;

        if (!appointments || appointments.length === 0) {
          return { success: false, error: "No appointments this month" };
        }

        // Calcular métricas
        const completedCount = appointments.filter(
          (a) => a.status === "attended"
        ).length;
        const cancelledCount = appointments.filter(
          (a) => a.status === "cancelled"
        ).length;

        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("provider_account_id", providerId)
          .gte("created_at", startDate)
          .lte("created_at", endDateStr);

        const avgQualityScore = reviews
          ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
          : 0;

        const slaMetrics: SLAMetrics = {
          provider_id: providerId,
          month,
          response_time_avg: 2.5, // En producción, calcular desde audit logs
          completion_rate:
            (completedCount / appointments.length) * 100,
          quality_score: avgQualityScore,
          cancellation_rate:
            (cancelledCount / appointments.length) * 100,
          sla_compliance: true, // En producción, comparar con SLA
        };

        setMetrics(slaMetrics);
        return { success: true, data: slaMetrics };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error calculating metrics";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const applySLAPenalty = useCallback(
    async (slaId: string, amount: number, reason: string) => {
      setLoading(true);

      try {
        const { error: err } = await supabase
          .from("sla_penalties")
          .insert({
            sla_id: slaId,
            amount,
            reason,
            applied_at: new Date().toISOString(),
          });

        if (err) throw err;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error applying penalty";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getSLAComplianceReport = useCallback(
    async (startDate: string, endDate: string) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);

      try {
        const { data, error: err } = await supabase
          .from("sla_metrics")
          .select("*")
          .eq("provider_id", providerId)
          .gte("month", startDate)
          .lte("month", endDate);

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching report";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  return {
    metrics,
    loading,
    error,
    createSLA,
    calculateMetrics,
    applySLAPenalty,
    getSLAComplianceReport,
  };
}
