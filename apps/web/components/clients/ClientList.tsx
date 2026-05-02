"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClientWithLink } from "@/hooks/useClients";

interface ClientListProps {
  clients: ClientWithLink[];
  onToggleReminders: (linkId: string, enabled: boolean) => Promise<{ success: boolean }>;
  onEditNotes: (linkId: string) => void;
  loading?: boolean;
}

export function ClientList({
  clients,
  onToggleReminders,
  onEditNotes,
  loading = false,
}: ClientListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleToggle = async (linkId: string, enabled: boolean) => {
    setUpdatingId(linkId);
    await onToggleReminders(linkId, enabled);
    setUpdatingId(null);
  };

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-gray-600">No clients yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Add your first client to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clients.map((clientLink) => (
        <div
          key={clientLink.id}
          className="p-4 bg-white border rounded-lg hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Client name and info */}
              <h3 className="font-semibold">
                {clientLink.client.first_name}{" "}
                {clientLink.client.last_name && clientLink.client.last_name}
              </h3>

              {/* Contact info */}
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                {clientLink.client.phone && (
                  <span>📱 {clientLink.client.phone}</span>
                )}
                {clientLink.client.email && (
                  <span>✉️ {clientLink.client.email}</span>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-3 text-sm text-gray-500">
                <span>
                  <strong>{clientLink.total_appointments}</strong> appointments
                </span>
                <span>
                  <strong>{clientLink.total_attended}</strong> attended
                </span>
                {clientLink.total_no_show > 0 && (
                  <span className="text-red-600">
                    <strong>{clientLink.total_no_show}</strong> no-shows
                  </span>
                )}
              </div>

              {/* Notes */}
              {clientLink.internal_notes && (
                <p className="text-sm text-gray-600 mt-2 italic">
                  "{clientLink.internal_notes}"
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-col ml-4">
              <Button
                onClick={() => onEditNotes(clientLink.id)}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                Notes
              </Button>

              <button
                onClick={() =>
                  handleToggle(clientLink.id, !clientLink.whatsapp_reminders_enabled)
                }
                disabled={updatingId === clientLink.id || loading}
                className={`px-3 py-1 text-sm rounded transition ${
                  clientLink.whatsapp_reminders_enabled
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-gray-50 text-gray-700 border border-gray-200"
                }`}
              >
                {clientLink.whatsapp_reminders_enabled ? "✓ Reminders" : "Reminders"}
              </button>
            </div>
          </div>

          {/* Source badge */}
          <div className="mt-3 inline-block">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
              {clientLink.source === "manual_creation"
                ? "Manual"
                : clientLink.source === "self_registration"
                  ? "Self-registered"
                  : clientLink.source === "invitation_accepted"
                    ? "Invited"
                    : "Imported"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
