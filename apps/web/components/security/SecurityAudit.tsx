"use client";

import { useState } from "react";
import { Shield, AlertTriangle, CheckCircle2, Lock } from "lucide-react";

interface SecurityEvent {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  status: "success" | "failed" | "warning";
  details: string;
}

interface SecurityAuditProps {
  providerId: string;
}

export function SecurityAudit({ providerId }: SecurityAuditProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([
    {
      id: "evt-001",
      action: "Login",
      user: "admin@barbershop.com",
      timestamp: "2025-02-15 14:30:22",
      status: "success",
      details: "Acceso exitoso desde 192.168.1.1",
    },
    {
      id: "evt-002",
      action: "Cambio de Contraseña",
      user: "admin@barbershop.com",
      timestamp: "2025-02-15 13:45:10",
      status: "success",
      details: "Contraseña cambiada exitosamente",
    },
    {
      id: "evt-003",
      action: "Login Fallido",
      user: "admin@barbershop.com",
      timestamp: "2025-02-15 11:22:05",
      status: "failed",
      details: "Contraseña incorrecta - 2 intentos restantes",
    },
    {
      id: "evt-004",
      action: "Acceso API",
      user: "api_token_xxxxx",
      timestamp: "2025-02-15 10:15:32",
      status: "success",
      details: "Endpoint: /api/v1/appointments",
    },
    {
      id: "evt-005",
      action: "Permiso de Rol Modificado",
      user: "admin@barbershop.com",
      timestamp: "2025-02-14 09:30:00",
      status: "warning",
      details: "Rol 'Manager' modificado - gestionar pagos habilitado",
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed" | "warning">("all");

  const filteredEvents = events.filter(
    (evt) => filterStatus === "all" || evt.status === filterStatus
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "failed":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200";
      case "failed":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const securityScore = 92;
  const failedLogins = events.filter((e) => e.status === "failed").length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Auditoría de Seguridad
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Puntuación de Seguridad</p>
            <p className="text-3xl font-bold text-blue-600">{securityScore}%</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Accesos Exitosos</p>
            <p className="text-3xl font-bold text-green-600">
              {events.filter((e) => e.status === "success").length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Intentos Fallidos</p>
            <p className="text-3xl font-bold text-red-600">{failedLogins}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Advertencias</p>
            <p className="text-3xl font-bold text-yellow-600">
              {events.filter((e) => e.status === "warning").length}
            </p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Estado de Seguridad
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>✓ 2FA habilitado para administrador</li>
            <li>✓ HTTPS/SSL activo en todos los endpoints</li>
            <li>✓ Contraseña actualizada hace 45 días</li>
            <li>⚠ Hay 2 intentos de login fallidos recientes</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Registro de Eventos</h3>
          <div className="flex gap-2">
            {(["all", "success", "failed", "warning"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  filterStatus === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "Todos" : status === "success" ? "Exitosos" : status === "failed" ? "Fallidos" : "Advertencias"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 ${getStatusColor(event.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {getStatusIcon(event.status)}
                  <div>
                    <p className="font-semibold">{event.action}</p>
                    <p className="text-sm text-gray-600">{event.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600">{event.timestamp}</span>
              </div>
              <p className="text-sm text-gray-700">{event.details}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Acciones de Seguridad</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left text-sm border rounded hover:bg-gray-50 transition">
              🔐 Cambiar Contraseña
            </button>
            <button className="w-full px-4 py-2 text-left text-sm border rounded hover:bg-gray-50 transition">
              🗝️ Generar Nuevas Claves API
            </button>
            <button className="w-full px-4 py-2 text-left text-sm border rounded hover:bg-gray-50 transition">
              👥 Ver Sesiones Activas
            </button>
            <button className="w-full px-4 py-2 text-left text-sm border rounded hover:bg-gray-50 transition">
              🔒 Descargar Reporte de Auditoría
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Últimos 7 días</span>
              <span className="font-semibold">24 eventos</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Accesos por API</span>
              <span className="font-semibold">8 eventos</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Cambios de Permisos</span>
              <span className="font-semibold">2 eventos</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span>Cambios de Datos</span>
              <span className="font-semibold">14 eventos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
