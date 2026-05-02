"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Service } from "@/hooks/useServices";

interface ServiceFormProps {
  service?: Service | null;
  onSubmit: (data: {
    name: string;
    durationMinutes: number;
    price: number;
    description?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export function ServiceForm({
  service,
  onSubmit,
  onCancel,
  loading = false,
}: ServiceFormProps) {
  const [formData, setFormData] = useState({
    name: service?.name || "",
    durationMinutes: service?.duration_minutes || 30,
    price: service?.price || 0,
    description: service?.description || "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "durationMinutes" || name === "price" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.name.trim()) {
      setError("Service name is required");
      setIsSubmitting(false);
      return;
    }

    if (formData.durationMinutes < 5 || formData.durationMinutes > 480) {
      setError("Duration must be between 5 and 480 minutes");
      setIsSubmitting(false);
      return;
    }

    if (formData.price < 0) {
      setError("Price cannot be negative");
      setIsSubmitting(false);
      return;
    }

    const result = await onSubmit(formData);

    if (!result.success) {
      setError(result.error || "Failed to save service");
    } else {
      onCancel();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Service Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Haircut, Beard Trim"
          className="w-full px-3 py-2 border rounded-md text-sm"
          disabled={loading || isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (minutes) *
          </label>
          <input
            type="number"
            name="durationMinutes"
            value={formData.durationMinutes}
            onChange={handleChange}
            min="5"
            max="480"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price *</label>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-md text-sm"
              disabled={loading || isSubmitting}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Optional description visible to clients"
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
          {isSubmitting ? "Saving..." : service ? "Update" : "Create"} Service
        </Button>
      </div>
    </form>
  );
}
