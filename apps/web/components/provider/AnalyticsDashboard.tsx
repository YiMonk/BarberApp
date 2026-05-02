"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useAnalytics } from "@/hooks/useAnalytics";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Calendar, Star, Users, TrendingUp, CheckCircle2, XCircle } from "lucide-react";

interface ProviderAccount {
  id: string;
}

export function AnalyticsDashboard() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const { analytics, loading, fetchAnalytics } = useAnalytics(providerId);

  // Fetch provider ID first
  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from("provider_accounts")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (data) {
          setProviderId(data.id);
        }
      } catch (err) {
        console.error("Error fetching provider ID:", err);
      }
    };

    fetchProviderId();
  }, [user?.id]);

  // Fetch analytics when provider ID is set
  useEffect(() => {
    if (providerId) {
      fetchAnalytics();
    }
  }, [providerId, fetchAnalytics]);

  if (loading || !analytics) {
    return <div className="text-center text-gray-500 py-12">Cargando analíticas...</div>;
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtext?: string;
    color: string;
  }) => (
    <div className={`bg-white p-6 rounded-lg border ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>{Icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
          label="Citas Totales"
          value={analytics.totalAppointments}
          subtext={`${analytics.attendedAppointments} completadas`}
          color="border-blue-200 bg-blue-50"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6 text-green-600" />}
          label="Confirmadas"
          value={analytics.confirmedAppointments}
          subtext={`${Math.round((analytics.confirmedAppointments / analytics.totalAppointments) * 100)}% de total`}
          color="border-green-200 bg-green-50"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-purple-600" />}
          label="Clientes Activos"
          value={analytics.activeClients}
          subtext={`De ${analytics.totalClients} totales`}
          color="border-purple-200 bg-purple-50"
        />
        <StatCard
          icon={<Star className="w-6 h-6 text-yellow-600" />}
          label="Calificación"
          value={`${analytics.averageRating} ⭐`}
          subtext={`${analytics.totalReviews} reseñas`}
          color="border-yellow-200 bg-yellow-50"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Canceladas</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                {analytics.cancelledAppointments}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-400 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">No-show</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">
                {analytics.noShowAppointments}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-orange-400 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Programas Lealtad</p>
              <p className="text-2xl font-bold text-indigo-600 mt-2">
                {analytics.loyaltyProgramsCount}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.totalLoyaltyRewards} recompensas
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-indigo-400 opacity-50" />
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="font-semibold text-lg mb-4">Resumen de Rendimiento</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-600">Tasa de Finalización</span>
            <span className="font-medium">
              {analytics.totalAppointments > 0
                ? Math.round((analytics.attendedAppointments / analytics.totalAppointments) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b">
            <span className="text-gray-600">Tasa de No-show</span>
            <span className="font-medium">
              {analytics.totalAppointments > 0
                ? Math.round((analytics.noShowAppointments / analytics.totalAppointments) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Clientes por Cita</span>
            <span className="font-medium">
              {analytics.totalAppointments > 0
                ? (analytics.activeClients / analytics.totalAppointments).toFixed(1)
                : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
