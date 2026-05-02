"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WeeklyAvailability } from "@/hooks/useSchedule";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface WeeklyScheduleEditorProps {
  schedule: WeeklyAvailability[];
  onUpdate: (
    dayOfWeek: number,
    startTime: string,
    endTime: string
  ) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function WeeklyScheduleEditor({
  schedule,
  onUpdate,
  loading = false,
}: WeeklyScheduleEditorProps) {
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [formData, setFormData] = useState({ startTime: "", endTime: "" });
  const [error, setError] = useState<string | null>(null);

  const handleEdit = (day: number) => {
    const existing = schedule.find((s) => s.day_of_week === day);
    setEditingDay(day);
    setFormData({
      startTime: existing?.start_time || "09:00:00",
      endTime: existing?.end_time || "17:00:00",
    });
    setError(null);
  };

  const handleSave = async () => {
    setError(null);

    if (!formData.startTime || !formData.endTime) {
      setError("Both times are required");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("Start time must be before end time");
      return;
    }

    if (editingDay !== null) {
      const result = await onUpdate(
        editingDay,
        formData.startTime,
        formData.endTime
      );

      if (result.success) {
        setEditingDay(null);
      } else {
        setError(result.error || "Failed to update schedule");
      }
    }
  };

  return (
    <div className="space-y-4">
      {DAYS.map((dayName, dayOfWeek) => {
        const daySchedule = schedule.find((s) => s.day_of_week === dayOfWeek);
        const isEditing = editingDay === dayOfWeek;

        return (
          <div
            key={dayOfWeek}
            className="p-4 border rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{dayName}</h3>
                {!isEditing && daySchedule && (
                  <p className="text-sm text-gray-600 mt-1">
                    {daySchedule.start_time} - {daySchedule.end_time}
                  </p>
                )}
              </div>

              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={formData.startTime.substring(0, 5)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value + ":00",
                      }))
                    }
                    className="px-2 py-1 border rounded text-sm"
                    disabled={loading}
                  />
                  <span className="text-gray-600">to</span>
                  <input
                    type="time"
                    value={formData.endTime.substring(0, 5)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value + ":00",
                      }))
                    }
                    className="px-2 py-1 border rounded text-sm"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSave}
                    size="sm"
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => setEditingDay(null)}
                    size="sm"
                    variant="outline"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleEdit(dayOfWeek)}
                  size="sm"
                  variant="outline"
                  disabled={loading}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        );
      })}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
