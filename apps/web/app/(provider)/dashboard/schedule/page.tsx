"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useSchedule } from "@/hooks/useSchedule";
import { WeeklyScheduleEditor } from "@/components/schedule/WeeklyScheduleEditor";
import { OverridesEditor } from "@/components/schedule/OverridesEditor";

export default function SchedulePage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const {
    weeklySchedule,
    overrides,
    loading,
    error,
    fetchSchedule,
    updateWeeklyAvailability,
    addOverride,
    deleteOverride,
  } = useSchedule(providerId);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (err) {
        console.error("Error fetching provider:", err);
        return;
      }

      setProviderId(data.id);
    };

    fetchProviderId();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) {
      fetchSchedule();
    }
  }, [providerId, fetchSchedule]);

  if (loading && weeklySchedule.length === 0) {
    return <div className="p-6">Loading schedule...</div>;
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Schedule</h1>
        <p className="text-gray-600 mt-1">
          Set your working hours and manage exceptions
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Weekly Schedule */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Weekly Schedule</h2>
          <p className="text-sm text-gray-600 mb-6">
            Set your regular working hours for each day of the week
          </p>
          <WeeklyScheduleEditor
            schedule={weeklySchedule}
            onUpdate={updateWeeklyAvailability}
            loading={loading}
          />
        </div>

        {/* Exceptions/Overrides */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Exceptions</h2>
          <p className="text-sm text-gray-600 mb-6">
            Add vacation days, holidays, or special closures
          </p>
          <OverridesEditor
            overrides={overrides}
            onAdd={addOverride}
            onDelete={deleteOverride}
            loading={loading}
          />
        </div>
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Your schedule is used to automatically
          generate available time slots for customers when they book
          appointments.
        </p>
      </div>
    </main>
  );
}
