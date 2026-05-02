"use client";

import { useState } from "react";
import { LineChart, TrendingUp, AlertCircle, Lightbulb } from "lucide-react";

interface BusinessInsightsProps {
  providerId: string;
}

export function BusinessInsights({ providerId }: BusinessInsightsProps) {
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "appointments" | "clients">(
    "revenue"
  );

  const insights = [
    {
      title: "Ingresos Crecientes",
      description: "Tu ingreso ha aumentado 23% en el último mes",
      metric: "+$450",
      trend: "up",
      color: "green",
      recommendation: "Mantén el ritmo con marketing consistente",
    },
    {
      title: "Demanda de Servicios",
      description: "El servicio 'Corte Premium' es el más solicitado",
      metric: "47%",
      trend: "up",
      color: "blue",
      recommendation: "Considera ofrecer paquetes con este servicio",
    },
    {
      title: "Disponibilidad Baja",
      description: "Solo queda 15% de horarios disponibles esta semana",
      metric: "Crítico",
      trend: "down",
      color: "red",
      recommendation: "Abre más horarios o aumenta precios",
    },
    {
      title: "Satisfacción del Cliente",
      description: "Las reseñas han mejorado a 4.8 estrellas",
      metric: "4.8★",
      trend: "up",
      color: "yellow",
      recommendation: "Solicita más reseñas a clientes satisfechos",
    },
  ];

  const chartData = {
    revenue: [
      { month: "Ene", value: 2000 },
      { month: "Feb", value: 2300 },
      { month: "Mar", value: 1900 },
      { month: "Abr", value: 2700 },
      { month: "May", value: 2500 },
    ],
    appointments: [
      { month: "Ene", value: 45 },
      { month: "Feb", value: 52 },
      { month: "Mar", value: 48 },
      { month: "Abr", value: 61 },
      { month: "May", value: 58 },
    ],
    clients: [
      { month: "Ene", value: 28 },
      { month: "Feb", value: 35 },
      { month: "Mar", value: 38 },
      { month: "Abr", value: 45 },
      { month: "May", value: 52 },
    ],
  };

  const data = chartData[selectedMetric];
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Lightbulb className="w-6 h-6" />
          Insights de Negocio
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`rounded-lg border-l-4 p-4 ${
                insight.color === "green"
                  ? "border-l-green-500 bg-green-50"
                  : insight.color === "blue"
                  ? "border-l-blue-500 bg-blue-50"
                  : insight.color === "red"
                  ? "border-l-red-500 bg-red-50"
                  : "border-l-yellow-500 bg-yellow-50"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">{insight.title}</h3>
                <TrendingUp
                  className={`w-5 h-5 ${
                    insight.trend === "up"
                      ? "text-green-600"
                      : insight.color === "red"
                      ? "text-red-600"
                      : "text-gray-400"
                  } ${insight.trend === "down" ? "rotate-180" : ""}`}
                />
              </div>

              <p className="text-sm text-gray-700 mb-2">{insight.description}</p>

              <div className="mb-3">
                <p className={`text-2xl font-bold ${
                  insight.color === "green"
                    ? "text-green-600"
                    : insight.color === "blue"
                    ? "text-blue-600"
                    : insight.color === "red"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}>
                  {insight.metric}
                </p>
              </div>

              <div className="bg-white/50 rounded px-3 py-2 text-xs text-gray-700 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                {insight.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <LineChart className="w-5 h-5" />
          Tendencias
        </h3>

        <div className="flex gap-2 mb-6">
          {(["revenue", "appointments", "clients"] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded text-sm font-medium ${
                selectedMetric === metric
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {metric === "revenue"
                ? "Ingresos"
                : metric === "appointments"
                ? "Citas"
                : "Clientes"}
            </button>
          ))}
        </div>

        <div className="flex items-end justify-around h-64 gap-4 mb-4 px-4">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-700"
                style={{
                  height: `${(item.value / maxValue) * 240}px`,
                }}
              />
              <p className="text-xs font-semibold text-gray-700">{item.month}</p>
              <p className="text-xs text-gray-600">${item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Alertas Activas
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>⚠️ Horarios casi llenos para este fin de semana</li>
          <li>✓ Buena retención de clientes esta semana</li>
          <li>📈 Oportunidad: Promocionar "Corte Premium" más</li>
        </ul>
      </div>
    </div>
  );
}
