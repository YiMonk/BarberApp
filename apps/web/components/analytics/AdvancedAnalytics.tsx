"use client";

import { useState } from "react";
import { BarChart, TrendingUp, AlertTriangle } from "lucide-react";

interface AdvancedAnalyticsProps {
  providerId: string;
}

export function AdvancedAnalytics({ providerId }: AdvancedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "quarter">("month");

  const behavioralInsights = [
    {
      title: "Comportamiento del Cliente",
      metrics: [
        { label: "Clientes Activos", value: 342, change: "+12%" },
        { label: "Tasa de Retención", value: "87%", change: "+3%" },
        { label: "Frecuencia Promedio", value: "2.5 veces/mes", change: "-0.2" },
      ],
    },
    {
      title: "Patrones de Gasto",
      metrics: [
        { label: "Ticket Promedio", value: "$45.50", change: "+8%" },
        { label: "Gasto Anual/Cliente", value: "$273", change: "+15%" },
        { label: "Clientes de Alto Valor", value: 24, change: "+6" },
      ],
    },
  ];

  const churnPrediction = [
    { segment: "Alto Riesgo", count: 12, percentage: 3.5, recommendation: "Contactar inmediatamente" },
    { segment: "Riesgo Medio", count: 34, percentage: 9.9, recommendation: "Ofrecer promoción" },
    { segment: "Bajo Riesgo", count: 296, percentage: 86.5, recommendation: "Mantener comunicación" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Analítica Avanzada
          </h2>

          <div className="flex gap-2">
            {(["week", "month", "quarter"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  selectedPeriod === period
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {period === "week" ? "Semana" : period === "month" ? "Mes" : "Trimestre"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {behavioralInsights.map((insight, idx) => (
          <div key={idx} className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              {insight.title}
            </h3>

            <div className="space-y-4">
              {insight.metrics.map((metric, midx) => (
                <div key={midx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-sm font-semibold ${
                      metric.change.startsWith("+")
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {metric.change}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Predicción de Abandono
        </h3>

        <div className="space-y-3">
          {churnPrediction.map((prediction, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{prediction.segment}</p>
                <span className="text-2xl font-bold">{prediction.count}</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full ${
                    prediction.segment === "Alto Riesgo"
                      ? "bg-red-600"
                      : prediction.segment === "Riesgo Medio"
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                  style={{ width: `${prediction.percentage}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{prediction.percentage}%</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  prediction.segment === "Alto Riesgo"
                    ? "bg-red-100 text-red-700"
                    : prediction.segment === "Riesgo Medio"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {prediction.recommendation}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Insights Clave</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Tu tasa de retención está por encima del promedio de la industria</li>
          <li>• Aumenta tus esfuerzos en clientes de alto riesgo para evitar pérdidas</li>
          <li>• Considera ofrecer paquetes a largo plazo para incrementar el valor anual</li>
        </ul>
      </div>
    </div>
  );
}
