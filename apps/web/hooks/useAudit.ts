import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "cancel"
  | "login"
  | "logout"
  | "export";

export interface AuditLog {
  id: string;
  provider_account_id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export function useAudit(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const logAction = useCallback(
    async (
      action: AuditAction,
      entityType: string,
      entityId: string,
      changes?: Record<string, any>
    ) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      try {
        const { data: userData } = await supabase.auth.getUser();

        const logEntry = {
          provider_account_id: providerId,
          user_id: userData?.user?.id,
          action,
          entity_type: entityType,
          entity_id: entityId,
          changes,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        const { error: err } = await supabase.from("audit_logs").insert(logEntry);

        if (err) throw err;

        return { success: true };
      } catch (err) {
        console.error("Error logging action:", err);
        return { success: false };
      }
    },
    [providerId]
  );

  const fetchLogs = useCallback(
    async (filters?: { action?: AuditAction; entityType?: string; limit?: number }) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .eq("provider_account_id", providerId)
          .order("timestamp", { ascending: false });

        if (filters?.action) {
          query = query.eq("action", filters.action);
        }

        if (filters?.entityType) {
          query = query.eq("entity_type", filters.entityType);
        }

        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.limit(100);
        }

        const { data, error: err } = await query;

        if (err) throw err;

        setLogs(data || []);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching logs";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const exportLogs = useCallback(
    async (format: "csv" | "json" = "csv") => {
      if (logs.length === 0) return;

      if (format === "csv") {
        const headers = [
          "Fecha",
          "Acción",
          "Tipo de Entidad",
          "ID Entidad",
          "Cambios",
        ];
        const rows = logs.map((log) => [
          new Date(log.timestamp).toLocaleString("es-CL"),
          log.action,
          log.entity_type,
          log.entity_id,
          JSON.stringify(log.changes || {}),
        ]);

        const csv = [
          headers.join(","),
          ...rows.map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
          ),
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        downloadFile(blob, "audit-logs.csv");
      } else {
        const json = JSON.stringify(logs, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        downloadFile(blob, "audit-logs.json");
      }
    },
    [logs]
  );

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return {
    logs,
    loading,
    error,
    logAction,
    fetchLogs,
    exportLogs,
  };
}

async function getClientIP(): Promise<string | undefined> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch {
    return undefined;
  }
}
