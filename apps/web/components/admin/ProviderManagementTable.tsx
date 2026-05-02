"use client";

import { ProviderForAdmin } from "@/hooks/useAdminProviders";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Calendar } from "lucide-react";

interface ProviderManagementTableProps {
  providers: ProviderForAdmin[];
  onToggle?: (id: string, isActive: boolean) => void;
  onExtend?: (id: string) => void;
  loading?: boolean;
}

export function ProviderManagementTable({
  providers,
  onToggle,
  onExtend,
  loading = false,
}: ProviderManagementTableProps) {
  if (providers.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No se encontraron proveedores
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b bg-gray-50">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-900">
              Nombre del Negocio
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900">
              Email
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900">
              Suscripción
            </th>
            <th className="text-left px-4 py-3 font-semibold text-gray-900">
              Estado
            </th>
            <th className="text-right px-4 py-3 font-semibold text-gray-900">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {providers.map((provider) => {
            const isExpired =
              provider.subscription &&
              new Date(provider.subscription.current_period_end) < new Date();

            const statusLabel = provider.subscription
              ? provider.subscription.status
              : "N/A";

            const statusColor = isExpired
              ? "text-red-600"
              : provider.subscription?.status === "trial"
              ? "text-blue-600"
              : provider.subscription?.status === "active"
              ? "text-green-600"
              : "text-gray-600";

            return (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {provider.business_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {provider.display_name}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {provider.email}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <p className={`font-medium ${statusColor}`}>
                      {statusLabel}
                    </p>
                    {provider.subscription && (
                      <p className="text-xs text-gray-600">
                        Until{" "}
                        {new Date(provider.subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {provider.is_active ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-600">
                          Activo
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-xs font-medium text-red-600">
                          Bloqueado
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    {onExtend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExtend(provider.id)}
                        disabled={loading}
                        title="Extender suscripción"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    {onToggle && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onToggle(provider.id, provider.is_active)}
                        disabled={loading}
                        className={
                          provider.is_active
                            ? "text-red-600 hover:text-red-700"
                            : "text-green-600 hover:text-green-700"
                        }
                      >
                        {provider.is_active ? "Bloquear" : "Desbloquear"}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
