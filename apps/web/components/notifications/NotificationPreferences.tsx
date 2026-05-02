"use client";

import { useEffect, useState } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";

interface NotificationPreferencesProps {
  userId: string | null;
}

export function NotificationPreferences({ userId }: NotificationPreferencesProps) {
  const { isSubscribed, subscribeToPush, unsubscribeFromPush } =
    usePushNotifications(userId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    appointmentReminder24h: true,
    appointmentReminder1h: true,
    cancellations: true,
    reviews: true,
  });

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);

    const result = await subscribeToPush();
    if (!result.success) {
      setError(result.error || "Error al suscribirse a notificaciones push");
    }

    setLoading(false);
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError(null);

    const result = await unsubscribeFromPush();
    if (!result.success) {
      setError(result.error || "Error al desuscribirse de notificaciones push");
    }

    setLoading(false);
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // TODO: Guardar preferencias en la base de datos
  };

  return (
    <div className="space-y-6">
      {/* Push notification status */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Notificaciones Push</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isSubscribed
                ? "Estás recibiendo notificaciones push"
                : "Habilita notificaciones push para recibir recordatorios"}
            </p>
          </div>
          {isSubscribed ? (
            <BellOff className="w-5 h-5 text-gray-400" />
          ) : (
            <Bell className="w-5 h-5 text-blue-600" />
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {isSubscribed ? (
            <Button
              onClick={handleUnsubscribe}
              disabled={loading}
              variant="outline"
              className="text-red-600"
            >
              {loading ? "..." : "Deshabilitar Notificaciones Push"}
            </Button>
          ) : (
            <Button onClick={handleSubscribe} disabled={loading}>
              {loading ? "..." : "Habilitar Notificaciones Push"}
            </Button>
          )}
        </div>
      </div>

      {/* Notification type preferences */}
      {isSubscribed && (
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900">Tipos de Notificaciones</h3>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.appointmentReminder24h}
              onChange={() => handlePreferenceChange("appointmentReminder24h")}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-sm text-gray-900">24 horas antes de la cita</p>
              <p className="text-xs text-gray-600">Recibe un recordatorio 24 horas antes de tu cita</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.appointmentReminder1h}
              onChange={() => handlePreferenceChange("appointmentReminder1h")}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-sm text-gray-900">1 hora antes de la cita</p>
              <p className="text-xs text-gray-600">Recibe un recordatorio 1 hora antes de tu cita</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.cancellations}
              onChange={() => handlePreferenceChange("cancellations")}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-sm text-gray-900">Cancelaciones y cambios</p>
              <p className="text-xs text-gray-600">Recibe notificaciones cuando se cancelen o reprogramen citas</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={preferences.reviews}
              onChange={() => handlePreferenceChange("reviews")}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="font-sm text-gray-900">Reseñas y calificaciones</p>
              <p className="text-xs text-gray-600">Recibe notificaciones cuando recibas nuevas reseñas</p>
            </div>
          </label>

          <Button disabled className="w-full text-gray-500">
            Guardar Preferencias (Próximamente)
          </Button>
        </div>
      )}
    </div>
  );
}
