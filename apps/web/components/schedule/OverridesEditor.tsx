"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AvailabilityOverride } from "@/hooks/useSchedule";

interface OverridesEditorProps {
  overrides: AvailabilityOverride[];
  onAdd: (
    date: string,
    startTime: string,
    endTime: string,
    reason: string
  ) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  loading?: boolean;
}

export function OverridesEditor({
  overrides,
  onAdd,
  onDelete,
  loading = false,
}: OverridesEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOverride = async () => {
    setError(null);

    if (!formData.date || !formData.reason.trim()) {
      setError("Date and reason are required");
      return;
    }

    setIsSubmitting(true);
    const result = await onAdd(
      formData.date,
      formData.startTime + ":00",
      formData.endTime + ":00",
      formData.reason
    );

    if (result.success) {
      setFormData({
        date: "",
        startTime: "09:00",
        endTime: "17:00",
        reason: "",
      });
      setShowForm(false);
    } else {
      setError(result.error || "Failed to add override");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {!showForm && (
        <Button onClick={() => setShowForm(true)} disabled={loading}>
          + Add Exception
        </Button>
      )}

      {showForm && (
        <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason *</label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder="e.g., Vacation, Meeting"
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From (optional)
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                To (optional)
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded text-sm"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAddOverride}
              disabled={isSubmitting || loading}
            >
              {isSubmitting ? "Adding..." : "Add Exception"}
            </Button>
            <Button
              onClick={() => setShowForm(false)}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {overrides.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Exceptions</h3>
          <div className="space-y-2">
            {overrides.map((override) => (
              <div
                key={override.id}
                className="p-3 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-sm">{override.reason}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {override.date}
                    {override.start_time !== "00:00:00" && (
                      <>
                        {" "}
                        ({override.start_time.substring(0, 5)} -{" "}
                        {override.end_time.substring(0, 5)})
                      </>
                    )}
                  </p>
                </div>
                <Button
                  onClick={() => onDelete(override.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
