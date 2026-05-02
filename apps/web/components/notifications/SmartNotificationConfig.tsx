"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Target, Settings } from "lucide-react";

interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  condition: string;
  deliveryTime: string;
  enabled: boolean;
  channels: string[];
}

interface SmartNotificationConfigProps {
  providerId: string;
}

export function SmartNotificationConfig({ providerId }: SmartNotificationConfigProps) {
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: "rule-001",
      name: "Recordatorio de Cita 24h",
      trigger: "Cita programada",
      condition: "24 horas antes",
      deliveryTime: "09:00 AM",
      enabled: true,
      channels: ["email", "sms", "push"],
    },
    {
      id: "rule-002",
      name: "Recordatorio de Cita 2h",
      trigger: "Cita programada",
      condition: "2 horas antes",
      deliveryTime: "Automático",
      enabled: true,
      channels: ["sms", "push"],
    },
    {
      id: "rule-003",
      name: "Confirmación de Cita",
      trigger: "Nueva cita",
      condition: "Inmediato",
      deliveryTime: "Inmediato",
      enabled: true,
      channels: ["email", "sms"],
    },
    {
      id: "rule-004",
      name: "Oferta de Fin de Semana",
      trigger: "Viernes",
      condition: "18:00 PM",
      deliveryTime: "18:00 PM",
      enabled: false,
      channels: ["email", "push"],
    },
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const toggleRule = (id: string) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notificaciones Inteligentes
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Reglas Totales</p>
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Activas</p>
            <p className="text-3xl font-bold text-green-600">{activeRulesCount}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Canales</p>
            <p className="text-3xl font-bold text-purple-600">3</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Tasa Apertura</p>
            <p className="text-3xl font-bold text-yellow-600">68%</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`border rounded-lg p-4 transition ${
              rule.enabled ? "bg-white hover:shadow-md" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <div>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {rule.trigger}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  rule.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                {rule.enabled ? "Activo" : "Inactivo"}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-3 mb-3 text-sm">
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-600 text-xs">Condición</p>
                <p className="font-semibold">{rule.condition}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded flex items-center gap-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-gray-600 text-xs">Entrega</p>
                  <p className="font-semibold">{rule.deliveryTime}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <p className="text-gray-600 text-xs">Canales</p>
                <div className="flex gap-1 flex-wrap mt-1">
                  {rule.channels.map((ch) => (
                    <span key={ch} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      {ch === "email" ? "📧" : ch === "sms" ? "💬" : "🔔"} {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={() => {}}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Editar Regla
            </Button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Opciones Avanzadas
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span>Respetar preferencias de horario del cliente</span>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span>Consolidar notificaciones múltiples</span>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" className="w-4 h-4" />
            <span>Usar IA para optimizar tiempos de envío</span>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
            <input type="checkbox" defaultChecked className="w-4 h-4" />
            <span>Rastrear tasas de apertura y clics</span>
          </label>
        </div>
      </div>

      <Button className="w-full bg-green-600 hover:bg-green-700">
        Guardar Configuración
      </Button>
    </div>
  );
}
