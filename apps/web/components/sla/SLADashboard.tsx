"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, TrendingUp, CheckCircle2 } from "lucide-react";

interface SLAMetric {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  status: "success" | "warning" | "critical";
}

interface SLADashboardProps {
  providerId: string;
}

export function SLADashboard({ providerId }: SLADashboardProps) {
  const [slaMetrics, setSlaMetrics] = useState<SLAMetric[]>([
    {
      id: "response_time",
      name: "Tiempo de Respuesta",
      target: 2,
      current: 1.5,
      unit: "horas",
      status: "success",
    },
    {
      id: "availability",
      name: "Disponibilidad",
      target: 99.5,
      current: 99.8,
      unit: "%",
      status: "success",
    },
    {
      id: "completion_rate",
      name: "Tasa de Completitud",
      target: 95,
      current: 92,
      unit: "%",
      status: "warning",
    },
    {
      id: "customer_satisfaction",
      name: "Satisfacción del Cliente",
      target: 4.5,
      current: 4.3,
      unit: "/5",
      status: "warning",
    },
  ]);

  const overallCompliance = (
    (slaMetrics.filter((m) => m.current >= m.target).length / slaMetrics.length) * 100
  ).toFixed(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "critical":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case "critical":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          Acuerdos de Nivel de Servicio (SLA)
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Cumplimiento General</p>
            <p className="text-3xl font-bold text-blue-600">{overallCompliance}%</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">En Cumplimiento</p>
            <p className="text-3xl font-bold text-green-600">
              {slaMetrics.filter((m) => m.status === "success").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Advertencias</p>
            <p className="text-3xl font-bold text-yellow-600">
              {slaMetrics.filter((m) => m.status === "warning").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600">Críticos</p>
            <p className="text-3xl font-bold text-red-600">
              {slaMetrics.filter((m) => m.status === "critical").length}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {slaMetrics.map((metric) => (
          <div key={metric.id} className={`border rounded-lg p-4 ${getStatusColor(metric.status)}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getStatusIcon(metric.status)}
                {metric.name}
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                metric.status === "success"
                  ? "bg-green-100 text-green-700"
                  : metric.status === "warning"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {metric.status === "success"
                  ? "En cumplimiento"
                  : metric.status === "warning"
                  ? "Advertencia"
                  : "Crítico"}
              </span>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Valor actual</p>
                <p className="text-2xl font-bold">
                  {metric.current} <span className="text-lg">{metric.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Meta</p>
                <p className="text-2xl font-bold">
                  {metric.target} <span className="text-lg">{metric.unit}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  metric.status === "success"
                    ? "bg-green-600"
                    : metric.status === "warning"
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{
                  width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recomendaciones
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Mejorar el tiempo de respuesta para mantener la excelencia del servicio</li>
          <li>• Revisar procesos de completitud de citas</li>
          <li>• Incrementar canales de comunicación con clientes</li>
        </ul>
      </div>
    </div>
  );
}
