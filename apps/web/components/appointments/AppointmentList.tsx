"use client";

import { Appointment } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";

interface AppointmentListProps {
  appointments: Appointment[];
  onApprove?: (id: string) => Promise<{ success: boolean }>;
  onReject?: (id: string) => Promise<{ success: boolean }>;
  onCancel?: (id: string) => Promise<{ success: boolean }>;
  onMarkAttended?: (id: string) => Promise<{ success: boolean }>;
  onMarkNoShow?: (id: string) => Promise<{ success: boolean }>;
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  draft: { color: "gray", label: "Draft" },
  pending_provider_approval: { color: "yellow", label: "Awaiting Your Approval" },
  pending_client_approval: { color: "yellow", label: "Awaiting Client Approval" },
  confirmed: { color: "green", label: "Confirmed" },
  rescheduled: { color: "blue", label: "Rescheduled" },
  cancelled: { color: "red", label: "Cancelled" },
  attended: { color: "green", label: "Attended" },
  no_show: { color: "red", label: "No-show" },
};

export function AppointmentList({
  appointments,
  onApprove,
  onReject,
  onCancel,
  onMarkAttended,
  onMarkNoShow,
  loading = false,
}: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
        <p className="text-gray-600">No appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => {
        const config = STATUS_CONFIG[apt.status];
        const startDate = new Date(apt.scheduled_start);
        const endDate = new Date(apt.scheduled_end);
        const isPending =
          apt.status === "pending_provider_approval" ||
          apt.status === "pending_client_approval";
        const isCompleted =
          apt.status === "attended" ||
          apt.status === "no_show" ||
          apt.status === "cancelled";

        return (
          <div
            key={apt.id}
            className="p-4 border rounded-lg hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Date and time */}
                <h3 className="font-semibold">
                  {startDate.toLocaleDateString([], {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                  {" • "}
                  {startDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {endDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </h3>

                {/* Status badge */}
                <div className="mt-2 inline-block">
                  <span
                    className={`text-xs px-2 py-1 rounded-full text-white ${
                      config.color === "gray"
                        ? "bg-gray-500"
                        : config.color === "yellow"
                          ? "bg-yellow-500"
                          : config.color === "green"
                            ? "bg-green-500"
                            : config.color === "blue"
                              ? "bg-blue-500"
                              : "bg-red-500"
                    }`}
                  >
                    {config.label}
                  </span>
                </div>

                {/* Notes */}
                {apt.notes && (
                  <p className="text-sm text-gray-600 mt-2">"{apt.notes}"</p>
                )}

                {/* Walk-in badge */}
                {apt.is_walk_in && (
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 ml-2">
                    Walk-in
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-col ml-4">
                {isPending && apt.status === "pending_provider_approval" && (
                  <>
                    <Button
                      onClick={() => onApprove?.(apt.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => onReject?.(apt.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {apt.status === "confirmed" && !isCompleted && (
                  <>
                    <Button
                      onClick={() => onMarkAttended?.(apt.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      Attended
                    </Button>
                    <Button
                      onClick={() => onMarkNoShow?.(apt.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      disabled={loading}
                    >
                      No-show
                    </Button>
                    <Button
                      onClick={() => onCancel?.(apt.id)}
                      size="sm"
                      variant="outline"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
