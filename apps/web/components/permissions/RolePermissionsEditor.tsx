"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Check } from "lucide-react";

interface RolePermission {
  role: string;
  permissions: string[];
}

interface RolePermissionsEditorProps {
  providerId: string;
}

const AVAILABLE_PERMISSIONS = [
  "manage_appointments",
  "manage_services",
  "manage_staff",
  "view_analytics",
  "manage_payments",
  "manage_clients",
  "manage_settings",
  "manage_coupons",
  "view_reports",
  "manage_notifications",
  "manage_subscriptions",
  "manage_roles",
];

const PERMISSION_LABELS: Record<string, string> = {
  manage_appointments: "Gestionar Citas",
  manage_services: "Gestionar Servicios",
  manage_staff: "Gestionar Personal",
  view_analytics: "Ver Analítica",
  manage_payments: "Gestionar Pagos",
  manage_clients: "Gestionar Clientes",
  manage_settings: "Gestionar Configuración",
  manage_coupons: "Gestionar Cupones",
  view_reports: "Ver Reportes",
  manage_notifications: "Gestionar Notificaciones",
  manage_subscriptions: "Gestionar Suscripciones",
  manage_roles: "Gestionar Roles",
};

const DEFAULT_ROLES: RolePermission[] = [
  {
    role: "admin",
    permissions: AVAILABLE_PERMISSIONS,
  },
  {
    role: "manager",
    permissions: [
      "manage_appointments",
      "manage_clients",
      "view_analytics",
      "view_reports",
      "manage_notifications",
    ],
  },
  {
    role: "staff",
    permissions: ["manage_appointments", "manage_clients"],
  },
];

export function RolePermissionsEditor({ providerId }: RolePermissionsEditorProps) {
  const [roles, setRoles] = useState<RolePermission[]>(DEFAULT_ROLES);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const togglePermission = (role: string, permission: string) => {
    setRoles(
      roles.map((r) => {
        if (r.role === role) {
          const permissions = r.permissions.includes(permission)
            ? r.permissions.filter((p) => p !== permission)
            : [...r.permissions, permission];
          return { ...r, permissions };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Permisos por Rol
      </h2>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          ✓ Permisos actualizados correctamente
        </div>
      )}

      <div className="space-y-6">
        {roles.map((roleData) => (
          <div key={roleData.role} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{roleData.role}</h3>
              <button
                onClick={() => setEditingRole(editingRole === roleData.role ? null : roleData.role)}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                {editingRole === roleData.role ? "Hecho" : "Editar"}
              </button>
            </div>

            {editingRole === roleData.role ? (
              <div className="p-4 space-y-2">
                {AVAILABLE_PERMISSIONS.map((permission) => (
                  <label key={permission} className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={roleData.permissions.includes(permission)}
                      onChange={() => togglePermission(roleData.role, permission)}
                      className="w-4 h-4 rounded"
                    />
                    <span>{PERMISSION_LABELS[permission]}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {roleData.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
                    >
                      <Check className="w-4 h-4" />
                      {PERMISSION_LABELS[permission]}
                    </span>
                  ))}
                </div>
                {roleData.permissions.length === 0 && (
                  <p className="text-gray-500 text-sm">Sin permisos asignados</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="w-full mt-6 bg-green-600 hover:bg-green-700">
        Guardar Cambios
      </Button>
    </div>
  );
}
