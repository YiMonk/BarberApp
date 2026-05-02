"use client";

import { useState } from "react";
import { Users, Filter, Target, TrendingUp } from "lucide-react";

interface ClientSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  value: number;
  churnRisk: number;
  ltv: number;
}

interface ClientSegmentationProps {
  providerId: string;
}

export function ClientSegmentation({ providerId }: ClientSegmentationProps) {
  const [segments, setSegments] = useState<ClientSegment[]>([
    {
      id: "seg-001",
      name: "Clientes VIP",
      description: "Clientes de alto valor con >$500 gastados",
      count: 12,
      value: 8400,
      churnRisk: 5,
      ltv: 700,
    },
    {
      id: "seg-002",
      name: "Clientes Regulares",
      description: "Clientes que vienen 2-3 veces por mes",
      count: 45,
      value: 6750,
      churnRisk: 15,
      ltv: 150,
    },
    {
      id: "seg-003",
      name: "Clientes Ocasionales",
      description: "Clientes que vienen <2 veces al mes",
      count: 78,
      value: 3510,
      churnRisk: 42,
      ltv: 45,
    },
    {
      id: "seg-004",
      name: "Clientes Nuevos",
      description: "Registrados en los últimos 30 días",
      count: 23,
      value: 805,
      churnRisk: 35,
      ltv: 35,
    },
    {
      id: "seg-005",
      name: "Clientes en Riesgo",
      description: "Sin actividad en los últimos 90 días",
      count: 18,
      value: 225,
      churnRisk: 85,
      ltv: 12.5,
    },
  ]);

  const totalClients = segments.reduce((sum, s) => sum + s.count, 0);
  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);

  const getChurnColor = (risk: number) => {
    if (risk < 25) return "bg-green-100 text-green-700";
    if (risk < 50) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-6 h-6" />
          Segmentación de Clientes
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Clientes</p>
            <p className="text-3xl font-bold text-blue-600">{totalClients}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Valor Total</p>
            <p className="text-3xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Segmentos</p>
            <p className="text-3xl font-bold text-purple-600">{segments.length}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Ticket Promedio</p>
            <p className="text-3xl font-bold text-yellow-600">
              ${(totalValue / totalClients).toFixed(0)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {segments.map((segment) => (
          <div key={segment.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{segment.name}</h3>
                <p className="text-sm text-gray-600">{segment.description}</p>
              </div>
              <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-semibold">
                {segment.count} clientes
              </span>
            </div>

            <div className="grid md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">${segment.value}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Valor de Vida</p>
                <p className="text-2xl font-bold text-blue-600">${segment.ltv}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Riesgo de Pérdida</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{segment.churnRisk}%</p>
                  <span className={`px-2 py-1 rounded text-xs ${getChurnColor(segment.churnRisk)}`}>
                    {segment.churnRisk < 25 ? "Bajo" : segment.churnRisk < 50 ? "Medio" : "Alto"}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs text-gray-600 mb-1">Ticket Promedio</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${(segment.value / segment.count).toFixed(0)}
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              <strong>Acción Recomendada:</strong>
              {segment.churnRisk > 70
                ? " Implementar campaña de re-engagement urgentemente"
                : segment.churnRisk > 40
                ? " Ofrecer promociones especiales y beneficios"
                : " Mantener comunicación consistente"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Distribución por Segmento
          </h3>

          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{segment.name}</span>
                  <span className="text-gray-600">{((segment.count / totalClients) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(segment.count / totalClients) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Valor por Segmento
          </h3>

          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{segment.name}</span>
                  <span className="text-gray-600">{((segment.value / totalValue) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(segment.value / totalValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
