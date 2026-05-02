"use client";

import { useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle2, Circle } from "lucide-react";

interface NotificationCenterProps {
  userId: string | null;
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification,
  } = usePushNotifications(userId);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
  };

  if (loading && notifications.length === 0) {
    return <div className="text-center text-gray-600 py-8">Cargando notificaciones...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with unread count */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Notificaciones</h2>
        {unreadCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            {unreadCount} nuevas
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>Sin notificaciones aún</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-colors ${
                notification.read
                  ? "bg-white border-gray-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 pt-1">
                  {notification.read_at ? (
                    <CheckCircle2 className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.body}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.created_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  {!notification.read_at && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
