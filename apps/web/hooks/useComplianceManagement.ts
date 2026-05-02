import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ComplianceChecklist {
  id: string;
  provider_id: string;
  name: string;
  items: ComplianceItem[];
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  last_completed?: string;
  completion_rate: number;
}

export interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

export function useComplianceManagement(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [checklists, setChecklists] = useState<ComplianceChecklist[]>([]);

  const createChecklist = useCallback(
    async (name: string, items: Omit<ComplianceItem, "id" | "completed">[]) => {
      if (!providerId) return { success: false };

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("compliance_checklists")
          .insert({
            provider_id: providerId,
            name,
            items: items.map((item) => ({ ...item, completed: false })),
          })
          .select()
          .single();

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

  const completeItem = useCallback(
    async (checklistId: string, itemId: string, userId: string) => {
      setLoading(true);

      try {
        const { error } = await supabase
          .from("compliance_checklists")
          .update({
            items: supabase.sql`jsonb_set(items, '{itemIndex, completed}', 'true')`,
          })
          .eq("id", checklistId);

        if (error) throw error;
        return { success: true };
      } catch (err) {
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getComplianceReport = useCallback(async () => {
    if (!providerId) return { success: false };

    try {
      const { data, error } = await supabase
        .from("compliance_checklists")
        .select("*")
        .eq("provider_id", providerId);

      if (error) throw error;

      const avgCompletion =
        data && data.length > 0
          ? data.reduce((sum, c) => sum + c.completion_rate, 0) / data.length
          : 0;

      return {
        success: true,
        data: {
          totalChecklists: data?.length || 0,
          averageCompletion: Math.round(avgCompletion),
          checklists: data,
        },
      };
    } catch (err) {
      return { success: false };
    }
  }, [providerId]);

  return { checklists, loading, createChecklist, completeItem, getComplianceReport };
}
