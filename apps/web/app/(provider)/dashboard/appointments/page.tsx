"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAppointments } from "@/hooks/useAppointments";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { CreateAppointmentForm } from "@/components/appointments/CreateAppointmentForm";
import { AppointmentList } from "@/components/appointments/AppointmentList";
import { Button } from "@/components/ui/button";

type FilterStatus = "all" | "pending" | "confirmed" | "completed";

export default function AppointmentsPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("confirmed");

  const { services, fetchServices } = useServices(providerId);
  const { clients, fetchClients } = useClients(providerId);
  const {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    approveAppointment,
    rejectAppointment,
    cancelAppointment,
    markAttended,
    markNoShow,
  } = useAppointments(providerId);

  // Fetch provider ID
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

  // Fetch data when provider ID is set
  useEffect(() => {
    if (providerId) {
      fetchServices();
      fetchClients();
      fetchAppointments();
    }
  }, [providerId]);

  const handleCreateAppointment = async (data: {
    startTime: string;
    endTime: string;
    serviceIds: string[];
    notes?: string;
    isWalkIn: boolean;
  }) => {
    if (!selectedClientId) {
      return { success: false, error: "Select a client" };
    }

    const result = await createAppointment({
      ...data,
      clientLinkId: selectedClientId,
      createdByRole: "provider",
    });

    if (result.success) {
      setShowCreateForm(false);
      setSelectedClientId(null);
      fetchAppointments();
    }

    return result;
  };

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending")
      return (
        apt.status === "pending_provider_approval" ||
        apt.status === "pending_client_approval"
      );
    if (filterStatus === "confirmed") return apt.status === "confirmed";
    if (filterStatus === "completed")
      return (
        apt.status === "attended" ||
        apt.status === "no_show" ||
        apt.status === "cancelled"
      );
    return true;
  });

  if (loading && appointments.length === 0) {
    return <div className="p-6">Loading appointments...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage your bookings</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={showCreateForm}
        >
          {showCreateForm ? "Cancel" : "+ New Appointment"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Appointment</h2>

          {/* Client selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Client *
            </label>
            <select
              value={selectedClientId || ""}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="">Choose a client...</option>
              {clients.map((clientLink) => (
                <option key={clientLink.id} value={clientLink.id}>
                  {clientLink.client.first_name}{" "}
                  {clientLink.client.last_name || ""} (
                  {clientLink.client.phone || "no phone"})
                </option>
              ))}
            </select>
          </div>

          {selectedClientId && (
            <CreateAppointmentForm
              clientLinkId={selectedClientId}
              services={services}
              onSubmit={handleCreateAppointment}
              onCancel={() => {
                setShowCreateForm(false);
                setSelectedClientId(null);
              }}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(["all", "pending", "confirmed", "completed"] as FilterStatus[]).map(
          (status) => (
            <Button
              key={status}
              onClick={() => setFilterStatus(status)}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          )
        )}
      </div>

      {/* Appointments list */}
      <AppointmentList
        appointments={filteredAppointments}
        onApprove={approveAppointment}
        onReject={rejectAppointment}
        onCancel={cancelAppointment}
        onMarkAttended={markAttended}
        onMarkNoShow={markNoShow}
        loading={loading}
      />

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Doble confirmación:</strong> Citas creadas por barbero
          requieren confirmación del cliente. Citas walk-in se confirman
          automáticamente.
        </p>
      </div>
    </main>
  );
}
