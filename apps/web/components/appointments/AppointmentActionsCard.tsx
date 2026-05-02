"use client";

import { useState } from "react";
import { Appointment } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

interface AppointmentActionsCardProps {
  appointment: Appointment;
  onMarkAttended: (id: string) => Promise<{ success: boolean }>;
  onMarkNoShow: (id: string) => Promise<{ success: boolean }>;
  onCancel: (id: string, reason?: string) => Promise<{ success: boolean }>;
  loading?: boolean;
}

export function AppointmentActionsCard({
  appointment,
  onMarkAttended,
  onMarkNoShow,
  onCancel,
  loading = false,
}: AppointmentActionsCardProps) {
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const isConfirmed = appointment.status === "confirmed";
  const isPast = new Date(appointment.scheduled_end) < new Date();
  const isFinal = ["attended", "no_show", "cancelled"].includes(appointment.status);

  const handleMarkAttended = async () => {
    const result = await onMarkAttended(appointment.id);
    if (result.success) {
      // UI will update automatically via parent
    }
  };

  const handleMarkNoShow = async () => {
    const result = await onMarkNoShow(appointment.id);
    if (result.success) {
      // UI will update automatically via parent
    }
  };

  const handleCancel = async () => {
    const result = await onCancel(appointment.id, cancelReason);
    if (result.success) {
      setShowCancelReason(false);
      setCancelReason("");
    }
  };

  if (isFinal) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {appointment.status === "attended" && "✓ Completada"}
            {appointment.status === "no_show" && "✗ No presentado"}
            {appointment.status === "cancelled" && "✗ Cancelada"}
          </span>
        </div>
      </div>
    );
  }

  if (!isConfirmed) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-700">
          Esta cita debe ser confirmada antes de realizar acciones
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!showCancelReason && (
        <div className="grid grid-cols-3 gap-2">
          {isPast && (
            <>
              <Button
                onClick={handleMarkAttended}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">Completada</span>
              </Button>
              <Button
                onClick={handleMarkNoShow}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                variant="outline"
                size="sm"
              >
                <XCircle className="w-4 h-4" />
                <span className="hidden sm:inline">No-show</span>
              </Button>
              <Button
                onClick={() => setShowCancelReason(true)}
                disabled={loading}
                className="flex items-center justify-center gap-2"
                variant="outline"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Cancelar</span>
              </Button>
            </>
          )}
          {!isPast && (
            <Button
              onClick={() => setShowCancelReason(true)}
              disabled={loading}
              className="col-span-3 flex items-center justify-center gap-2"
              variant="outline"
            >
              <Clock className="w-4 h-4" />
              Cancelar cita
            </Button>
          )}
        </div>
      )}

      {showCancelReason && (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
          <p className="text-sm font-medium text-red-900">¿Estás seguro? Motivo (opcional):</p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Cliente solicitó cancelación"
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Confirmar Cancelación
            </Button>
            <Button
              onClick={() => {
                setShowCancelReason(false);
                setCancelReason("");
              }}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Atrás
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
