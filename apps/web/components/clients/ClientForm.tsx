"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ClientFormProps {
  onSubmit: (data: {
    firstName: string;
    phone?: string;
    email?: string;
    lastName?: string;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export function ClientForm({ onSubmit, onCancel, loading = false }: ClientFormProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!formData.firstName.trim()) {
      setError("First name is required");
      setIsSubmitting(false);
      return;
    }

    if (formData.email && !formData.email.includes("@")) {
      setError("Valid email required");
      setIsSubmitting(false);
      return;
    }

    const result = await onSubmit({
      firstName: formData.firstName,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      notes: formData.notes || undefined,
    });

    if (result.success) {
      setFormData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        notes: "",
      });
      onCancel();
    } else {
      setError(result.error || "Failed to create client");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Juan"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="García"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="juan@example.com"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading || isSubmitting}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Internal Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="e.g., Prefers short cuts, left-handed"
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
          {isSubmitting ? "Creating..." : "Add Client"}
        </Button>
      </div>
    </form>
  );
}
