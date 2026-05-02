import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface NotificationTemplate {
  id: string;
  provider_id: string;
  type: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  enabled: boolean;
}

export function useNotificationTemplates(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  const saveTemplate = useCallback(
    async (template: Omit<NotificationTemplate, "id">) => {
      if (!providerId) return { success: false };

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("notification_templates")
          .upsert({ ...template, provider_id: providerId })
          .select();

        if (error) throw error;
        return { success: true, data };
      } catch (err) {
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  return { loading, templates, saveTemplate };
}
