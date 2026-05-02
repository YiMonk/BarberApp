"use client";

import { WaitlistEntry } from "@/hooks/useWaitlist";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface WaitlistListProps {
  entries: WaitlistEntry[];
  onCancel?: (entryId: string) => void;
  isProvider?: boolean;
  loading?: boolean;
}

const statusConfig = {
  waiting: {
    label: "Esperando",
    icon: Clock,
    color: "bg-blue-100 text-blue-700",
  },
  notified: {
    label: "Notificado",
    icon: AlertCircle,
    color: "bg-yellow-100 text-yellow-700",
  },
  converted: {
    label: "Convertido",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700",
  },
  expired: {
    label: "Expirado",
    icon: XCircle,
    color: "bg-red-100 text-red-700",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-gray-100 text-gray-700",
  },
};

export function WaitlistList({
  entries,
  onCancel,
  isProvider = false,
  loading = false,
}: WaitlistListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        {isProvider ? "Sin entradas en lista de espera aún" : "Sin entradas pendientes en lista de espera"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const config = statusConfig[entry.status];
        const StatusIcon = config.icon;

        return (
          <div
            key={entry.id}
            className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {entry.client?.first_name} {entry.client?.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Desired: {new Date(entry.desired_date).toLocaleDateString()}
                  {entry.desired_time_start && ` at ${entry.desired_time_start}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>

                {isProvider && entry.status === "waiting" && onCancel && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(entry.id)}
                    disabled={loading}
                    className="text-gray-600 hover:text-red-700"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {entry.client?.phone && (
              <p className="text-xs text-gray-600">
                📞 {entry.client.phone}
              </p>
            )}

            {entry.notification_expires_at &&
              entry.status === "notified" && (
                <p className="text-xs text-yellow-700 mt-2">
                  ⏰ Offer expires:{" "}
                  {new Date(entry.notification_expires_at).toLocaleString()}
                </p>
              )}
          </div>
        );
      })}
    </div>
  );
}
