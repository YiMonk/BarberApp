import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export type CommissionType = "percentage" | "fixed";

export interface StaffMember {
  id: string;
  provider_account_id: string;
  name: string;
  email: string;
  phone?: string;
  role: "barber" | "assistant" | "manager";
  commission_type: CommissionType;
  commission_value: number;
  hourly_rate?: number;
  is_active: boolean;
  hire_date: string;
  created_at: string;
}

export interface Commission {
  id: string;
  staff_id: string;
  appointment_id: string;
  amount: number;
  commission_type: CommissionType;
  commission_percentage: number;
  service_amount: number;
  created_at: string;
}

export function useStaffManagement(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  const fetchStaff = useCallback(async () => {
    if (!providerId) return { success: false, error: "No provider ID" };

    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from("staff_members")
        .select("*")
        .eq("provider_account_id", providerId)
        .order("hire_date", { ascending: false });

      if (err) throw err;

      setStaff(data || []);
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error fetching staff";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  const createStaffMember = useCallback(
    async (staffData: Omit<StaffMember, "id" | "created_at">) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("staff_members")
          .insert({
            ...staffData,
            provider_account_id: providerId,
          })
          .select()
          .single();

        if (err) throw err;

        setStaff((prev) => [data, ...prev]);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error creating staff";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const updateStaffMember = useCallback(
    async (staffId: string, updates: Partial<StaffMember>) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: err } = await supabase
          .from("staff_members")
          .update(updates)
          .eq("id", staffId)
          .select()
          .single();

        if (err) throw err;

        setStaff((prev) =>
          prev.map((s) => (s.id === staffId ? data : s))
        );
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error updating staff";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteStaffMember = useCallback(
    async (staffId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: err } = await supabase
          .from("staff_members")
          .delete()
          .eq("id", staffId);

        if (err) throw err;

        setStaff((prev) => prev.filter((s) => s.id !== staffId));
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error deleting staff";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const calculateCommission = useCallback(
    (staffMember: StaffMember, serviceAmount: number): number => {
      if (staffMember.commission_type === "percentage") {
        return (serviceAmount * staffMember.commission_value) / 100;
      } else {
        return staffMember.commission_value;
      }
    },
    []
  );

  const generateCommissionReport = useCallback(
    async (staffId: string, startDate: string, endDate: string) => {
      setLoading(true);

      try {
        const { data, error: err } = await supabase
          .from("commissions")
          .select("*")
          .eq("staff_id", staffId)
          .gte("created_at", startDate)
          .lte("created_at", endDate);

        if (err) throw err;

        const totalAmount = (data || []).reduce((sum, c) => sum + c.amount, 0);

        return {
          success: true,
          data: {
            commissions: data || [],
            total: totalAmount,
            count: data?.length || 0,
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error generating report";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    staff,
    loading,
    error,
    fetchStaff,
    createStaffMember,
    updateStaffMember,
    deleteStaffMember,
    calculateCommission,
    generateCommissionReport,
  };
}
