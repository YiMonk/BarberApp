"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useLoyalty } from "@/hooks/useLoyalty";
import { LoyaltyProgramCard } from "@/components/loyalty/LoyaltyProgramCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LoyaltyPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const { programs, loading, error, fetchPrograms, deleteProgram } =
    useLoyalty(providerId);
  const [showCreateForm, setShowCreateForm] = useState(false);

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
      fetchPrograms();
    }
  }, [providerId, fetchPrograms]);

  const handleDelete = async (programId: string) => {
    if (!window.confirm("Are you sure you want to delete this loyalty program?")) {
      return;
    }

    const result = await deleteProgram(programId);
    if (result.success) {
      // Success, program already removed from state
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold">Programas de Fidelización</h1>
          <p className="text-gray-600 mt-2">
            Crea y gestiona programas de fidelización para recompensar a tus mejores clientes
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={showCreateForm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Programa
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Create form placeholder */}
      {showCreateForm && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Crear Nuevo Programa de Fidelización</h2>
          <p className="text-sm text-blue-900 mb-4">
            Selecciona el tipo de programa que quieres crear:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <h3 className="font-semibold text-gray-900">Tarjeta de Puntos</h3>
              <p className="text-sm text-gray-600">Gana sellos, canjea recompensas</p>
            </button>
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <h3 className="font-semibold text-gray-900">Descuento por Visita</h3>
              <p className="text-sm text-gray-600">Descuento en visitas específicas</p>
            </button>
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <h3 className="font-semibold text-gray-900">Bono de Cumpleaños</h3>
              <p className="text-sm text-gray-600">Recompensas especiales de cumpleaños</p>
            </button>
            <button className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <h3 className="font-semibold text-gray-900">Promoción Limitada</h3>
              <p className="text-sm text-gray-600">Promociones por tiempo limitado</p>
            </button>
          </div>

          <Button
            variant="outline"
            onClick={() => setShowCreateForm(false)}
            className="mt-4"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Programs list */}
      {loading && programs.length === 0 ? (
        <div className="text-center text-gray-600 py-8">Cargando programas...</div>
      ) : programs.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          <p className="mb-4">No hay programas de fidelización aún</p>
          <Button onClick={() => setShowCreateForm(true)}>
            Crear tu primer programa
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs.map((program) => (
            <LoyaltyProgramCard
              key={program.id}
              program={program}
              isAdmin={true}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Cómo funciona:</strong> Crea programas de fidelización para incentivar visitas repetidas.
          Rastrea automáticamente el progreso del cliente y recompensa hitos con descuentos
          o servicios gratuitos.
        </p>
      </div>
    </main>
  );
}
