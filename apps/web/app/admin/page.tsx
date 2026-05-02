"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAdminProviders } from "@/hooks/useAdminProviders";
import { ProviderManagementTable } from "@/components/admin/ProviderManagementTable";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    expiringSubscriptions: 0,
  });

  const {
    providers,
    loading: providersLoading,
    error,
    fetchProviders,
    toggleProvider,
    extendSubscription,
  } = useAdminProviders();

  // Check if user is super admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { data, error: err } = await supabase
          .from("super_admins")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (err || !data) {
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        router.push("/dashboard");
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, router]);

  // Fetch providers
  useEffect(() => {
    if (isAdmin && !checkingAdmin) {
      fetchProviders();
    }
  }, [isAdmin, checkingAdmin, fetchProviders]);

  // Calculate stats
  useEffect(() => {
    if (providers.length > 0) {
      const active = providers.filter((p) => p.is_active).length;
      const expiring = providers.filter(
        (p) =>
          p.subscription &&
          new Date(p.subscription.current_period_end) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalProviders: providers.length,
        activeProviders: active,
        expiringSubscriptions: expiring,
      });
    }
  }, [providers]);

  if (checkingAdmin || authLoading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect in useEffect
  }

  const handleToggle = async (providerId: string, isActive: boolean) => {
    const result = await toggleProvider(providerId, isActive);
    if (!result.success) {
      alert(result.error || "Failed to update provider");
    }
  };

  const handleExtend = async (providerId: string) => {
    const days = prompt("How many days do you want to extend? (e.g., 30)");
    if (!days || isNaN(parseInt(days))) return;

    const result = await extendSubscription(providerId, parseInt(days));
    if (!result.success) {
      alert(result.error || "Failed to extend subscription");
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-600 mt-2">Gestiona proveedores y suscripciones</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Total de Proveedores</p>
          <p className="text-3xl font-bold text-gray-900">{stats.totalProviders}</p>
        </div>
        <div className="p-6 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Proveedores Activos</p>
          <p className="text-3xl font-bold text-green-600">{stats.activeProviders}</p>
        </div>
        <div className="p-6 bg-white border rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Vencimiento Próximo (7 días)</p>
          <p className="text-3xl font-bold text-red-600">{stats.expiringSubscriptions}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Providers table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-6 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Proveedores
          </h2>
        </div>

        {providersLoading ? (
          <div className="p-6 text-center text-gray-600">Cargando proveedores...</div>
        ) : (
          <ProviderManagementTable
            providers={providers}
            onToggle={handleToggle}
            onExtend={handleExtend}
            loading={providersLoading}
          />
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Panel de admin:</strong> Ve todos los proveedores, gestiona suscripciones,
          y controla el acceso a la plataforma. Usa el botón "Bloquear" para desactivar una cuenta
          o "Extender" para añadir días de suscripción.
        </p>
      </div>
    </main>
  );
}
