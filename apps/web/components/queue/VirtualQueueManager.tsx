"use client";

import { useVirtualQueue } from "@/hooks/useVirtualQueue";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle2 } from "lucide-react";

interface VirtualQueueManagerProps {
  providerId: string;
}

export function VirtualQueueManager({ providerId }: VirtualQueueManagerProps) {
  const { queue, loading, getQueueStatus, joinQueue } = useVirtualQueue(providerId);
  const [clientId, setClientId] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      await getQueueStatus();
    };

    const interval = setInterval(fetchQueue, 5000);
    fetchQueue();

    return () => clearInterval(interval);
  }, [getQueueStatus]);

  const handleJoinQueue = async () => {
    if (!clientId.trim()) return;

    const result = await joinQueue(clientId);
    if (result.success) {
      setJoined(true);
      setClientId("");
      await getQueueStatus();
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando cola...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6" />
          Cola Virtual
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">En Cola</p>
            <p className="text-3xl font-bold text-blue-600">{queue?.length || 0}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Espera Promedio</p>
            <p className="text-3xl font-bold text-yellow-600">
              {queue?.length > 0 ? Math.round((queue.length * 15) / 60) : 0} min
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Atendidos Hoy</p>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
        </div>

        {joined && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span>¡Unido a la cola exitosamente!</span>
          </div>
        )}

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="ID del cliente..."
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <Button onClick={handleJoinQueue} className="bg-blue-600 hover:bg-blue-700">
            Unirse
          </Button>
        </div>
      </div>

      {queue && queue.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Posiciones en Cola</h3>

          <div className="space-y-3">
            {queue.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-gray-50 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center font-bold text-blue-600">
                    #{entry.position}
                  </div>
                  <div>
                    <p className="font-semibold">Cliente: {entry.client_id}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {entry.status === "waiting" && `Espera: ${entry.estimated_wait_time} min`}
                      {entry.status === "next" && "Próximo a ser atendido"}
                      {entry.status === "in_service" && "En atención"}
                      {entry.status === "completed" && "Completado"}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  entry.status === "waiting" ? "bg-yellow-100 text-yellow-700" :
                  entry.status === "next" ? "bg-blue-100 text-blue-700" :
                  entry.status === "in_service" ? "bg-purple-100 text-purple-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  {entry.status === "waiting" && "Esperando"}
                  {entry.status === "next" && "Próximo"}
                  {entry.status === "in_service" && "En servicio"}
                  {entry.status === "completed" && "Completado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
