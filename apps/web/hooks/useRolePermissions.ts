import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type Role = "owner" | "manager" | "staff" | "client";
export type Permission =
  | "appointments:read"
  | "appointments:create"
  | "appointments:update"
  | "appointments:delete"
  | "clients:read"
  | "clients:create"
  | "clients:update"
  | "reports:view"
  | "settings:manage"
  | "staff:manage"
  | "payments:view"
  | "payments:refund";

export interface RolePermission {
  role: Role;
  permissions: Permission[];
  description: string;
}

const DEFAULT_ROLES: Record<Role, Permission[]> = {
  owner: [
    "appointments:read",
    "appointments:create",
    "appointments:update",
    "appointments:delete",
    "clients:read",
    "clients:create",
    "clients:update",
    "reports:view",
    "settings:manage",
    "staff:manage",
    "payments:view",
    "payments:refund",
  ],
  manager: [
    "appointments:read",
    "appointments:create",
    "appointments:update",
    "clients:read",
    "clients:create",
    "reports:view",
    "payments:view",
  ],
  staff: [
    "appointments:read",
    "appointments:update",
    "clients:read",
  ],
  client: [
    "appointments:read",
  ],
};

export function useRolePermissions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = useCallback(
    (userRole: Role, requiredPermission: Permission): boolean => {
      return DEFAULT_ROLES[userRole].includes(requiredPermission);
    },
    []
  );

  const hasAnyPermission = useCallback(
    (userRole: Role, permissions: Permission[]): boolean => {
      return permissions.some((perm) => hasPermission(userRole, perm));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (userRole: Role, permissions: Permission[]): boolean => {
      return permissions.every((perm) => hasPermission(userRole, perm));
    },
    [hasPermission]
  );

  const assignRoleToUser = useCallback(
    async (userId: string, role: Role, providerId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: err } = await supabase
          .from("user_roles")
          .upsert({
            user_id: userId,
            provider_account_id: providerId,
            role,
          });

        if (err) throw err;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error assigning role";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const createCustomRole = useCallback(
    async (
      roleName: string,
      permissions: Permission[],
      providerId: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("custom_roles")
          .insert({
            name: roleName,
            permissions,
            provider_account_id: providerId,
          })
          .select()
          .single();

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating role";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const auditPermissionChange = useCallback(
    async (
      userId: string,
      action: "granted" | "revoked",
      permission: Permission,
      providerId: string
    ) => {
      try {
        await supabase.from("permission_audit_logs").insert({
          user_id: userId,
          action,
          permission,
          provider_account_id: providerId,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error logging permission change:", err);
      }
    },
    []
  );

  return {
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    assignRoleToUser,
    createCustomRole,
    auditPermissionChange,
    DEFAULT_ROLES,
  };
}
