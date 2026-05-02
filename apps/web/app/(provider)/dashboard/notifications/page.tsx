"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("provider_accounts")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching provider:", error);
        return;
      }

      setProviderId(data.id);
    };

    fetchProviderId();
  }, [user?.id]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Notificaciones y Preferencias</h1>
        <p className="text-gray-600 mt-2">
          Gestiona tus notificaciones y preferencias
        </p>
      </div>

      <Tabs defaultValue="center">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="center">Centro de Notificaciones</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="center" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <NotificationCenter userId={user?.id || null} />
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="bg-white p-6 rounded-lg border">
            <NotificationPreferences userId={user?.id || null} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>How it works:</strong> You'll receive push notifications for
          appointment reminders 24 hours and 1 hour before your scheduled time. You can
          customize these preferences below.
        </p>
      </div>
    </main>
  );
}
