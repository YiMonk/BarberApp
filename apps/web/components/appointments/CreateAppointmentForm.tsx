"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Service } from "@/hooks/useServices";

interface CreateAppointmentFormProps {
  clientLinkId: string;
  services: Service[];
  onSubmit: (data: {
    startTime: string;
    endTime: string;
    serviceIds: string[];
    notes?: string;
    isWalkIn: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export function CreateAppointmentForm({
  clientLinkId,
  services,
  onSubmit,
  onCancel,
  loading = false,
}: CreateAppointmentFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    duration: 30,
    selectedServices: [] as string[],
    notes: "",
    isWalkIn: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "duration"
            ? Number(value)
            : value,
    }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter((id) => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  // Calcular duración total desde servicios seleccionados
  const totalDuration = formData.selectedServices.reduce((sum, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return sum + (service?.duration_minutes || 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.selectedServices.length) {
      setError("Select at least one service");
      setIsSubmitting(false);
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(
      startDateTime.getTime() + totalDuration * 60 * 1000
    );

    const result = await onSubmit({
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      serviceIds: formData.selectedServices,
      notes: formData.notes || undefined,
      isWalkIn: formData.isWalkIn,
    });

    if (!result.success) {
      setError(result.error || "Failed to create appointment");
    } else {
      onCancel();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Start Time *</label>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="block text-sm font-medium mb-2">Services *</label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {services.map((service) => (
            <label key={service.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.selectedServices.includes(service.id)}
                onChange={() => toggleService(service.id)}
                disabled={loading || isSubmitting}
                className="w-4 h-4"
              />
              <div className="flex-1">
                <span className="font-sm">{service.name}</span>
                <span className="text-xs text-gray-600 ml-2">
                  {service.duration_minutes} min • ${service.price}
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Duration summary */}
      {totalDuration > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <strong>Total duration:</strong> {totalDuration} minutes
          <br />
          <strong>End time:</strong>{" "}
          {new Date(
            new Date(`${formData.date}T${formData.startTime}`).getTime() +
              totalDuration * 60 * 1000
          ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {/* Walk-in checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isWalkIn"
          checked={formData.isWalkIn}
          onChange={handleChange}
          disabled={loading || isSubmitting}
          className="w-4 h-4"
        />
        <span className="text-sm">Walk-in appointment (auto-confirm)</span>
      </label>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Optional notes about this appointment"
          rows={3}
          className="w-full px-3 py-2 border rounded-md text-sm"
          disabled={loading || isSubmitting}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          onClick={onCancel}
          disabled={loading || isSubmitting}
          variant="outline"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Appointment"}
        </Button>
      </div>
    </form>
  );
}
