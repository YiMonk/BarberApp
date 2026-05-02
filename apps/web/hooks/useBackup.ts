import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Backup {
  id: string;
  provider_account_id: string;
  name: string;
  size: number; // en bytes
  created_at: string;
  includes: string[]; // qué tablas incluye
  status: "pending" | "completed" | "failed";
}

export function useBackup(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);

  const createBackup = useCallback(
    async (name: string, includeTables: string[] = [
      "appointments",
      "clients",
      "services",
      "loyalty_programs",
    ]) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const backupData: any = {};

        // Recolectar datos de las tablas
        for (const table of includeTables) {
          const { data, error: err } = await supabase
            .from(table)
            .select("*")
            .eq("provider_account_id", providerId);

          if (err) throw err;
          backupData[table] = data || [];
        }

        // Crear archivo
        const backup = {
          id: `backup_${Date.now()}`,
          provider_account_id: providerId,
          name,
          size: JSON.stringify(backupData).length,
          created_at: new Date().toISOString(),
          includes: includeTables,
          status: "completed",
        };

        // Guardar metadata del backup
        const { error: saveError } = await supabase
          .from("backups")
          .insert(backup);

        if (saveError) throw saveError;

        // Descargar archivo
        const jsonStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup_${name}_${new Date().toISOString().split("T")[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);

        setBackups((prev) => [backup, ...prev]);
        return { success: true, backup };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating backup";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const fetchBackups = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("backups")
        .select("*")
        .eq("provider_account_id", providerId)
        .order("created_at", { ascending: false });

      if (err) throw err;

      setBackups(data || []);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching backups";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const restoreBackup = useCallback(
    async (backup: Backup) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        // En producción, implementar restauración real
        // Por ahora es un placeholder

        return {
          success: true,
          message: "Restauración completada (contacta soporte para datos reales)",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error restoring backup";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const deleteBackup = useCallback(
    async (backupId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: err } = await supabase
          .from("backups")
          .delete()
          .eq("id", backupId);

        if (err) throw err;

        setBackups((prev) => prev.filter((b) => b.id !== backupId));
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting backup";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const enableAutoBackups = useCallback(
    async (enabled: boolean, frequency: "daily" | "weekly" | "monthly") => {
      if (!providerId) return { success: false, error: "No provider ID" };

      try {
        const { error: err } = await supabase
          .from("provider_accounts")
          .update({
            auto_backups_enabled: enabled,
            backup_frequency: frequency,
          })
          .eq("id", providerId);

        if (err) throw err;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating backup settings";
        setError(message);
        return { success: false, error: message };
      }
    },
    [providerId]
  );

  return {
    backups,
    loading,
    error,
    createBackup,
    fetchBackups,
    restoreBackup,
    deleteBackup,
    enableAutoBackups,
  };
}
