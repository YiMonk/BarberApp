"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface ProviderAccount {
  id: string;
  business_name: string;
  email: string;
  onboarding_completed: boolean;
}

interface Subscription {
  status: string;
  expires_at: string;
}

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [provider, setProvider] = useState<ProviderAccount | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch provider account
        const { data: providerData, error: providerError } = await supabase
          .from("provider_accounts")
          .select("*")
          .eq("auth_user_id", user.id)
          .single();

        if (providerError) throw providerError;
        setProvider(providerData);

        // Fetch subscription
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("provider_account_id", providerData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subError && subError.code !== "PGRST116") throw subError;
        setSubscription(subData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No provider account found</p>
      </div>
    );
  }

  const trialDaysLeft = subscription
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.expires_at).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 14;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{provider.business_name}</h1>
        <p className="text-gray-600">Bienvenido a tu panel de control</p>
      </div>

      {/* Trial status */}
      <div className="grid gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                Prueba Activa
              </h2>
              <p className="text-blue-700 mt-1">
                {trialDaysLeft} días restantes
              </p>
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {trialDaysLeft}
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/dashboard/services" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Servicios</h3>
          <p className="text-sm text-gray-600 mb-4">
            Añade y gestiona tus servicios
          </p>
          <span className="text-blue-600 text-sm">Ir a Servicios →</span>
        </a>

        <a href="/dashboard/schedule" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Horarios</h3>
          <p className="text-sm text-gray-600 mb-4">
            Establece tu disponibilidad
          </p>
          <span className="text-blue-600 text-sm">Ir a Horarios →</span>
        </a>

        <a href="/dashboard/clients" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Clientes</h3>
          <p className="text-sm text-gray-600 mb-4">
            Gestiona tu base de datos de clientes
          </p>
          <span className="text-blue-600 text-sm">Ir a Clientes →</span>
        </a>

        <a href="/dashboard/appointments" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Citas</h3>
          <p className="text-sm text-gray-600 mb-4">
            Ve y gestiona tus reservas
          </p>
          <span className="text-blue-600 text-sm">Ir a Citas →</span>
        </a>

        <a href="/dashboard/reviews" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Reseñas</h3>
          <p className="text-sm text-gray-600 mb-4">
            Ve reseñas y calificaciones de clientes
          </p>
          <span className="text-blue-600 text-sm">Ir a Reseñas →</span>
        </a>

        <a href="/dashboard/loyalty" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Fidelización</h3>
          <p className="text-sm text-gray-600 mb-4">
            Recompensa a clientes frecuentes
          </p>
          <span className="text-blue-600 text-sm">Ir a Fidelización →</span>
        </a>

        <a href="/dashboard/waitlist" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Lista de Espera</h3>
          <p className="text-sm text-gray-600 mb-4">
            Gestiona las listas de espera de clientes
          </p>
          <span className="text-blue-600 text-sm">Ir a Lista de Espera →</span>
        </a>

        <a href="/dashboard/notifications" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">Notificaciones</h3>
          <p className="text-sm text-gray-600 mb-4">
            Gestiona notificaciones push y preferencias
          </p>
          <span className="text-blue-600 text-sm">Ir a Notificaciones →</span>
        </a>

        <a href="/dashboard/settings" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">⚙️ Configuración</h3>
          <p className="text-sm text-gray-600 mb-4">
            Edita tu perfil, contacto y datos del negocio
          </p>
          <span className="text-blue-600 text-sm">Ir a Configuración →</span>
        </a>

        <a href="/dashboard/analytics" className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
          <h3 className="font-semibold mb-2">📊 Analíticas</h3>
          <p className="text-sm text-gray-600 mb-4">
            Visualiza métricas y reportes de tu negocio
          </p>
          <span className="text-blue-600 text-sm">Ir a Analíticas →</span>
        </a>
      </div>

      {/* Onboarding status */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold mb-4">Estado de Configuración</h2>
        <div className="flex items-center justify-between">
          <div>
            {provider.onboarding_completed ? (
              <p className="text-green-600 text-sm">✓ Configuración completada</p>
            ) : (
              <p className="text-yellow-600 text-sm">
                Completa tu configuración para comenzar a aceptar citas
              </p>
            )}
          </div>
          {!provider.onboarding_completed && (
            <a
              href="/onboarding"
              className="text-blue-600 hover:underline text-sm"
            >
              Continuar Configuración →
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
