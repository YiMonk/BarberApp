"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Service } from "@/hooks/useServices";

interface ManualAppointmentWizardProps {
  services: Service[];
  onSubmit: (data: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    date: string;
    startTime: string;
    serviceIds: string[];
    notes?: string;
    inviteClient: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export function ManualAppointmentWizard({
  services,
  onSubmit,
  onCancel,
  loading = false,
}: ManualAppointmentWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    selectedServices: [] as string[],
    notes: "",
    inviteClient: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
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

  const totalDuration = formData.selectedServices.reduce((sum, serviceId) => {
    const service = services.find((s) => s.id === serviceId);
    return sum + (service?.duration_minutes || 0);
  }, 0);

  const handleNextStep = () => {
    setError(null);

    if (step === 1) {
      if (!formData.clientName.trim()) {
        setError("Client name is required");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.selectedServices.length) {
        setError("Select at least one service");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.date || !formData.startTime) {
        setError("Date and time are required");
        return;
      }
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    const result = await onSubmit({
      clientName: formData.clientName,
      clientPhone: formData.clientPhone || undefined,
      clientEmail: formData.clientEmail || undefined,
      date: formData.date,
      startTime: formData.startTime,
      serviceIds: formData.selectedServices,
      notes: formData.notes || undefined,
      inviteClient: formData.inviteClient,
    });

    if (!result.success) {
      setError(result.error || "Failed to create appointment");
      setIsSubmitting(false);
    } else {
      onCancel();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded ${
                s <= step ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center">
          Step {step} of 4
        </p>
      </div>

      {/* Step 1: Client info */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Client Information</h2>
            <p className="text-gray-600">Who is this appointment for?</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Client Name *
            </label>
            <input
              type="text"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              placeholder="e.g., Juan García"
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleChange}
                placeholder="juan@example.com"
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Services */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Select Services</h2>
            <p className="text-gray-600">Which services will be provided?</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-4">
            {services.map((service) => (
              <label key={service.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.selectedServices.includes(service.id)}
                  onChange={() => toggleService(service.id)}
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

          {totalDuration > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <strong>Total duration:</strong> {totalDuration} minutes
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date & Time */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Date & Time</h2>
            <p className="text-gray-600">When is the appointment?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 border rounded-lg text-sm">
            <p>
              <strong>End time:</strong>{" "}
              {new Date(
                new Date(`${formData.date}T${formData.startTime}`).getTime() +
                  totalDuration * 60 * 1000
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special notes about this appointment"
              rows={3}
              className="w-full px-4 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Confirmation</h2>
            <p className="text-gray-600">Ready to create the appointment?</p>
          </div>

          <div className="p-4 bg-gray-50 border rounded-lg space-y-3 text-sm">
            <div>
              <strong>Client:</strong> {formData.clientName}
              {formData.clientPhone && ` • ${formData.clientPhone}`}
            </div>

            <div>
              <strong>Services:</strong>{" "}
              {formData.selectedServices
                .map(
                  (id) => services.find((s) => s.id === id)?.name
                )
                .join(", ")}
            </div>

            <div>
              <strong>Date & Time:</strong> {formData.date} at{" "}
              {formData.startTime}
              <br />
              <strong>Duration:</strong> {totalDuration} minutes
            </div>

            {formData.notes && (
              <div>
                <strong>Notes:</strong> {formData.notes}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              name="inviteClient"
              checked={formData.inviteClient}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span className="text-sm">
              <strong>Send invitation link</strong>
              <br />
              {formData.clientPhone || formData.clientEmail
                ? "Client will receive a magic link to confirm"
                : "(provide phone or email to send invitation)"}
            </span>
          </label>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          onClick={handlePrevStep}
          disabled={step === 1 || loading}
          variant="outline"
          className="flex-1"
        >
          Back
        </Button>

        {step === 4 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Appointment"}
          </Button>
        ) : (
          <Button
            onClick={handleNextStep}
            disabled={loading}
            className="flex-1"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
