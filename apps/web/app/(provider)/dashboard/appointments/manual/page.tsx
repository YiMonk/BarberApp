"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useAppointments } from "@/hooks/useAppointments";
import { useInvitations } from "@/hooks/useInvitations";
import { useServices } from "@/hooks/useServices";
import { useClients } from "@/hooks/useClients";
import { ManualAppointmentWizard } from "@/components/appointments/ManualAppointmentWizard";
import { Button } from "@/components/ui/button";

export default function ManualAppointmentPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [createdInvitations, setCreatedInvitations] = useState<Array<{
    clientName: string;
    publicUrl: string;
    whatsappUrl?: string;
  }>>([]);

  const { services, fetchServices } = useServices(providerId);
  const { createAppointment, loading: apptLoading } = useAppointments(providerId);
  const { sendInvitation, loading: invLoading } = useInvitations(providerId);
  const { createClient } = useClients(providerId);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("id, phone, whatsapp_invitation_template")
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
      fetchServices();
    }
  }, [providerId]);

  const handleCreateManualAppointment = async (data: {
    clientName: string;
    clientPhone?: string;
    clientEmail?: string;
    date: string;
    startTime: string;
    serviceIds: string[];
    notes?: string;
    inviteClient: boolean;
  }) => {
    try {
      if (!providerId) return { success: false, error: "Provider ID required" };

      // 1. Crear cliente
      const clientResult = await createClient(
        data.clientName,
        data.clientPhone,
        data.clientEmail,
        undefined,
        undefined
      );

      if (!clientResult.success) {
        return { success: false, error: clientResult.error };
      }

      const clientLinkId = clientResult.client?.id;
      if (!clientLinkId) {
        return { success: false, error: "Failed to create client" };
      }

      // 2. Crear cita
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const totalDuration = data.serviceIds.reduce((sum, serviceId) => {
        const service = services.find((s) => s.id === serviceId);
        return sum + (service?.duration_minutes || 0);
      }, 0);
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60 * 1000);

      const apptResult = await createAppointment({
        clientLinkId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        serviceIds: data.serviceIds,
        notes: data.notes,
        createdByRole: "provider",
        isWalkIn: false,
      });

      if (!apptResult.success) {
        return { success: false, error: apptResult.error };
      }

      // 3. Enviar invitación si es necesario
      if (data.inviteClient && (data.clientPhone || data.clientEmail)) {
        const invResult = await sendInvitation({
          appointmentId: apptResult.appointment!.id,
          clientId: clientLinkId,
          sentToName: data.clientName,
          sentToPhone: data.clientPhone,
          sentToEmail: data.clientEmail,
          sentVia: data.clientPhone ? "whatsapp" : "email",
        });

        if (invResult.success) {
          // Generar WhatsApp URL
          const publicUrl = `${window.location.origin}${invResult.publicUrl}`;
          const message = `Hola ${data.clientName}! Te agendé una cita. Confirma aquí: ${publicUrl}`;
          const whatsappUrl = data.clientPhone
            ? `https://wa.me/${data.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
            : undefined;

          setCreatedInvitations((prev) => [
            ...prev,
            {
              clientName: data.clientName,
              publicUrl,
              whatsappUrl,
            },
          ]);
        }
      }

      setShowWizard(false);
      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create appointment";
      return { success: false, error: message };
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Create Appointment Manually</h1>
          <p className="text-gray-600 mt-1">
            Create appointments for clients and send invitation links
          </p>
        </div>
        <Button
          onClick={() => setShowWizard(!showWizard)}
          disabled={showWizard}
        >
          {showWizard ? "Cancel" : "+ New Manual Appointment"}
        </Button>
      </div>

      {showWizard && (
        <div className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-6">
            4-Step Appointment Wizard
          </h2>
          <ManualAppointmentWizard
            services={services}
            onSubmit={handleCreateManualAppointment}
            onCancel={() => setShowWizard(false)}
            loading={apptLoading || invLoading}
          />
        </div>
      )}

      {/* Created invitations */}
      {createdInvitations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Created Invitations</h2>
          {createdInvitations.map((inv, idx) => (
            <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-3">✅ {inv.clientName}</h3>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">CONFIRMATION LINK</p>
                  <p className="font-mono text-xs break-all bg-white p-2 rounded border">
                    {inv.publicUrl}
                  </p>
                </div>

                {inv.whatsappUrl && (
                  <div>
                    <a
                      href={inv.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      💬 Send via WhatsApp
                    </a>
                  </div>
                )}

                <div className="text-xs text-gray-600">
                  <p>
                    💡 Share the link above or use the WhatsApp button to invite{" "}
                    {inv.clientName}.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Cómo funciona:</strong> El cliente recibe un link mágico.
          Al hacer clic, ve los detalles de la cita y puede confirmar o rechazar.
          Tú ves el estado en el dashboard.
        </p>
      </div>
    </main>
  );
}
