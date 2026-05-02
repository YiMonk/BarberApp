"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useWaitlist } from "@/hooks/useWaitlist";
import { WaitlistList } from "@/components/waitlist/WaitlistList";
import { Button } from "@/components/ui/button";

export default function WaitlistPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const {
    entries,
    loading,
    error,
    fetchEntries,
    cancelEntry,
  } = useWaitlist(providerId);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (err) {
        console.error("Error fetching provider:", err);
        return;
      }

      setProviderId(data.id);
    };

    fetchProviderId();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) {
      fetchEntries();
    }
  }, [providerId, fetchEntries]);

  const filteredEntries =
    statusFilter === "all"
      ? entries
      : entries.filter((e) => e.status === statusFilter);

  const handleCancel = async (entryId: string) => {
    if (!window.confirm("Are you sure you want to cancel this waitlist entry?")) {
      return;
    }

    const result = await cancelEntry(entryId);
    if (!result.success) {
      alert(result.error || "Failed to cancel entry");
    }
  };

  // Count by status
  const statusCounts = {
    all: entries.length,
    waiting: entries.filter((e) => e.status === "waiting").length,
    notified: entries.filter((e) => e.status === "notified").length,
    converted: entries.filter((e) => e.status === "converted").length,
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gestión de Lista de Espera</h1>
        <p className="text-gray-600 mt-2">
          Gestiona los clientes que esperan por horarios disponibles
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {["all", "waiting", "notified", "converted"].map((status) => {
          const statusLabels: { [key: string]: string } = {
            all: "Todos",
            waiting: "Esperando",
            notified: "Notificados",
            converted: "Convertidos"
          };

          return (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="whitespace-nowrap"
            >
              {statusLabels[status]}
              {status === "all" && (
                <span className="ml-2 font-medium">{statusCounts.all}</span>
              )}
              {status === "waiting" && (
                <span className="ml-2 font-medium">{statusCounts.waiting}</span>
              )}
              {status === "notified" && (
                <span className="ml-2 font-medium">{statusCounts.notified}</span>
              )}
              {status === "converted" && (
                <span className="ml-2 font-medium">{statusCounts.converted}</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Entries list */}
      {loading && entries.length === 0 ? (
        <div className="text-center text-gray-600 py-8">Cargando lista de espera...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg border">
          <WaitlistList
            entries={filteredEntries}
            isProvider={true}
            onCancel={handleCancel}
            loading={loading}
          />
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Cómo funciona:</strong> Los clientes pueden unirse a tu lista de espera
          cuando no encuentran horarios disponibles. Cuando se libere un slot, serán notificados
          y tendrán 30 minutos para confirmar.
        </p>
      </div>
    </main>
  );
}
