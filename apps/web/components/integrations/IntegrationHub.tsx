"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Download, Trash2, ToggleRight } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
  enabled: boolean;
}

interface IntegrationHubProps {
  providerId: string;
}

export function IntegrationHub({ providerId }: IntegrationHubProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "int-001",
      name: "Google Calendar",
      description: "Sincroniza tus citas con Google Calendar",
      icon: "📅",
      status: "connected",
      lastSync: "2025-02-15 14:30",
      enabled: true,
    },
    {
      id: "int-002",
      name: "Stripe",
      description: "Procesar pagos con tarjeta de crédito",
      icon: "💳",
      status: "connected",
      lastSync: "2025-02-15 09:00",
      enabled: true,
    },
    {
      id: "int-003",
      name: "Twilio",
      description: "Enviar SMS y notificaciones",
      icon: "💬",
      status: "disconnected",
      enabled: false,
    },
    {
      id: "int-004",
      name: "Zapier",
      description: "Automatizar flujos de trabajo",
      icon: "⚡",
      status: "connected",
      lastSync: "2025-02-14 22:15",
      enabled: false,
    },
    {
      id: "int-005",
      name: "Resend",
      description: "Envío de emails transaccionales",
      icon: "📧",
      status: "connected",
      lastSync: "2025-02-15 13:45",
      enabled: true,
    },
    {
      id: "int-006",
      name: "WhatsApp",
      description: "Mensajería por WhatsApp Business",
      icon: "📱",
      status: "error",
      enabled: false,
    },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id ? { ...int, enabled: !int.enabled } : int
      )
    );
  };

  const disconnectIntegration = (id: string) => {
    setIntegrations(
      integrations.map((int) =>
        int.id === id
          ? { ...int, status: "disconnected", enabled: false }
          : int
      )
    );
  };

  const connectedCount = integrations.filter((i) => i.status === "connected").length;
  const enabledCount = integrations.filter((i) => i.enabled).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-700";
      case "disconnected":
        return "bg-gray-100 text-gray-700";
      case "error":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "disconnected":
        return "Desconectado";
      case "error":
        return "Error";
      default:
        return "Desconocido";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Centro de Integraciones
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Integraciones</p>
            <p className="text-3xl font-bold text-blue-600">{integrations.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Conectadas</p>
            <p className="text-3xl font-bold text-green-600">{connectedCount}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Activas</p>
            <p className="text-3xl font-bold text-purple-600">{enabledCount}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Con Errores</p>
            <p className="text-3xl font-bold text-yellow-600">
              {integrations.filter((i) => i.status === "error").length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{integration.icon}</span>
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <p className="text-sm text-gray-600">{integration.description}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(integration.status)}`}>
                {getStatusLabel(integration.status)}
              </span>
            </div>

            {integration.lastSync && (
              <p className="text-xs text-gray-500 mb-4">
                Última sincronización: {integration.lastSync}
              </p>
            )}

            <div className="flex gap-2 mb-3">
              {integration.status === "connected" && (
                <label className="flex items-center gap-2 p-2 bg-gray-50 rounded flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integration.enabled}
                    onChange={() => toggleIntegration(integration.id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{integration.enabled ? "Activo" : "Inactivo"}</span>
                </label>
              )}
            </div>

            <div className="flex gap-2">
              {integration.status === "connected" ? (
                <>
                  <Button
                    onClick={() => {}}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Resincronizar
                  </Button>
                  <Button
                    onClick={() => disconnectIntegration(integration.id)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                </>
              ) : (
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Conectar Integración
                </Button>
              )}
            </div>

            {integration.status === "error" && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                Error de conexión. Haz clic en "Conectar" para reintentar.
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Integraciones Disponibles</h3>
        <p className="text-sm text-blue-800 mb-3">
          Amplía las funcionalidades con más integraciones:
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Slack", icon: "💬" },
            { name: "HubSpot", icon: "🎯" },
            { name: "Mailchimp", icon: "📬" },
            { name: "Asana", icon: "✓" },
          ].map((app) => (
            <span key={app.name} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-sm">
              {app.icon} {app.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
