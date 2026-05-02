"use client";

import { useState } from "react";
import { Gauge, Zap, BarChart3, AlertCircle } from "lucide-react";

interface PerformanceMetricsProps {
  providerId: string;
}

export function PerformanceMetrics({ providerId }: PerformanceMetricsProps) {
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");

  const metrics = {
    pageLoadTime: 1.2,
    apiResponseTime: 245,
    uptime: 99.95,
    errorRate: 0.08,
    activeUsers: 142,
    requestsPerSecond: 3.4,
  };

  const benchmarks = {
    pageLoadTime: { target: 2.0, good: 1.5, excellent: 0.8 },
    apiResponseTime: { target: 300, good: 200, excellent: 100 },
    uptime: { target: 99.0, good: 99.5, excellent: 99.95 },
    errorRate: { target: 1.0, good: 0.5, excellent: 0.1 },
  };

  const getPerformanceStatus = (metric: string, value: number) => {
    const benchmark = benchmarks[metric as keyof typeof benchmarks];
    if (!benchmark) return "normal";

    if (metric === "errorRate" || metric === "apiResponseTime" || metric === "pageLoadTime") {
      if (value <= benchmark.excellent) return "excellent";
      if (value <= benchmark.good) return "good";
      if (value <= benchmark.target) return "normal";
      return "warning";
    }

    if (value >= benchmark.excellent) return "excellent";
    if (value >= benchmark.good) return "good";
    if (value >= benchmark.target) return "normal";
    return "warning";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "normal":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "warning":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "excellent":
        return "Excelente";
      case "good":
        return "Bueno";
      case "normal":
        return "Normal";
      case "warning":
        return "Necesita Mejora";
      default:
        return "Desconocido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6" />
            Métricas de Desempeño
          </h2>

          <div className="flex gap-2">
            {(["day", "week", "month"] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  timeframe === tf
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tf === "day" ? "Hoy" : tf === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-6 gap-3">
          {[
            { label: "Carga de Página", value: `${metrics.pageLoadTime}s`, status: getPerformanceStatus("pageLoadTime", metrics.pageLoadTime) },
            { label: "Respuesta API", value: `${metrics.apiResponseTime}ms`, status: getPerformanceStatus("apiResponseTime", metrics.apiResponseTime) },
            { label: "Disponibilidad", value: `${metrics.uptime}%`, status: getPerformanceStatus("uptime", metrics.uptime) },
            { label: "Tasa de Error", value: `${metrics.errorRate}%`, status: getPerformanceStatus("errorRate", metrics.errorRate) },
            { label: "Usuarios Activos", value: metrics.activeUsers, status: "good" },
            { label: "Req/seg", value: metrics.requestsPerSecond.toFixed(1), status: "good" },
          ].map((metric, idx) => (
            <div
              key={idx}
              className={`border rounded-lg p-3 ${getStatusColor(metric.status)}`}
            >
              <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
              <p className="text-xl font-bold">{metric.value}</p>
              <p className="text-xs mt-1">{getStatusLabel(metric.status)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Tiempos de Respuesta
          </h3>

          <div className="space-y-4">
            {[
              { endpoint: "/api/appointments", time: 245, target: 300 },
              { endpoint: "/api/clients", time: 178, target: 300 },
              { endpoint: "/api/analytics", time: 412, target: 500 },
              { endpoint: "/api/payments", time: 534, target: 600 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">{item.endpoint}</p>
                  <span className={`text-sm font-semibold ${item.time > item.target ? "text-red-600" : "text-green-600"}`}>
                    {item.time}ms
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.time > item.target ? "bg-red-600" : "bg-green-600"}`}
                    style={{ width: `${Math.min((item.time / item.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Disponibilidad
          </h3>

          <div className="space-y-3">
            {[
              { service: "API Principal", uptime: 99.98, lastIncident: "3 días" },
              { service: "Base de Datos", uptime: 99.99, lastIncident: "1 mes" },
              { service: "CDN", uptime: 99.95, lastIncident: "5 días" },
              { service: "Email", uptime: 99.92, lastIncident: "1 semana" },
            ].map((service, idx) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{service.service}</p>
                  <span className="text-sm font-bold text-green-600">{service.uptime}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${service.uptime}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600">Último incidente: {service.lastIncident}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Recomendaciones
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>✓ El rendimiento está dentro de los parámetros aceptables</li>
          <li>⚠ Optimizar la API de Analytics (412ms, target: 500ms)</li>
          <li>✓ Disponibilidad excelente en los últimos 30 días</li>
          <li>💡 Implementar caché para reducir tiempos de respuesta</li>
        </ul>
      </div>
    </div>
  );
}
