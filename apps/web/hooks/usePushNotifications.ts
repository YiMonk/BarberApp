import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Notification {
  id: string;
  recipient_user_id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  auth_key: string;
  p256dh_key: string;
  created_at: string;
}

export function usePushNotifications(userId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setNotifications(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch notifications";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Mark as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      setError(null);

      try {
        const { data, error: updateError } = await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("id", notificationId)
          .select()
          .single();

        if (updateError) throw updateError;

        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? data : n))
        );
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to mark as read";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from("notifications")
          .delete()
          .eq("id", notificationId);

        if (deleteError) throw deleteError;

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        return { success: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to delete notification";
        setError(message);
        return { success: false, error: message };
      }
    },
    []
  );

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async () => {
    setError(null);

    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service Workers are not supported");
      }

      const registration = await navigator.serviceWorker.ready;

      if (!registration.pushManager) {
        throw new Error("Push messaging is not supported");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      // Save subscription to database
      const { error: saveError } = await supabase.from("push_subscriptions").insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        auth_key: btoa(
          String.fromCharCode.apply(
            null,
            Array.from(
              new Uint8Array(subscription.getKey("auth") || new ArrayBuffer(0))
            ) as any
          )
        ),
        p256dh_key: btoa(
          String.fromCharCode.apply(
            null,
            Array.from(
              new Uint8Array(subscription.getKey("p256dh") || new ArrayBuffer(0))
            ) as any
          )
        ),
      });

      if (saveError) throw saveError;

      setIsSubscribed(true);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to subscribe to push";
      setError(message);
      return { success: false, error: message };
    }
  }, [userId]);

  // Unsubscribe from push notifications
  const unsubscribeFromPush = useCallback(async () => {
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { error: deleteError } = await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);

        if (deleteError) throw deleteError;

        setIsSubscribed(false);
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to unsubscribe from push";
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    notifications,
    loading,
    error,
    isSubscribed,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    subscribeToPush,
    unsubscribeFromPush,
  };
}
