"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface InvitationData {
  token: string;
  sent_to_name: string;
  status: string;
  expires_at: string;
  appointment?: {
    scheduled_start: string;
    scheduled_end: string;
    notes?: string;
    services?: Array<{
      service?: {
        name: string;
        price: number;
      };
    }>;
  };
  provider?: {
    business_name: string;
  };
}

export default function ConfirmAppointmentPage() {
  const params = useParams();
  const token = params.token as string;
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responding, setResponding] = useState(false);
  const [responded, setResponded] = useState(false);

  useEffect(() => {
    const fetchInvitation = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("appointment_invitations")
          .select(
            `*,
            appointment:appointment_id(
              scheduled_start,
              scheduled_end,
              notes,
              services:appointment_services(
                service:service_id(name, price)
              )
            ),
            provider:provider_account_id(business_name)
          `
          )
          .eq("token", token)
          .single();

        if (fetchError) throw new Error("Invitation not found");
        setInvitation(data as InvitationData);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load invitation";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvitation();
    }
  }, [token]);

  const handleAccept = async () => {
    setResponding(true);
    setError(null);

    try {
      // Actualizar invitación
      const { error: invError } = await supabase
        .from("appointment_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
        })
        .eq("token", token);

      if (invError) throw invError;

      // Confirmar cita
      const { data: invData } = await supabase
        .from("appointment_invitations")
        .select("appointment_id")
        .eq("token", token)
        .single();

      if (invData?.appointment_id) {
        await supabase
          .from("appointments")
          .update({ status: "confirmed" })
          .eq("id", invData.appointment_id);
      }

      setResponded(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to confirm appointment";
      setError(message);
    } finally {
      setResponding(false);
    }
  };

  const handleReject = async () => {
    setResponding(true);
    setError(null);

    try {
      // Actualizar invitación
      const { error: invError } = await supabase
        .from("appointment_invitations")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
        })
        .eq("token", token);

      if (invError) throw invError;

      // Cancelar cita
      const { data: invData } = await supabase
        .from("appointment_invitations")
        .select("appointment_id")
        .eq("token", token)
        .single();

      if (invData?.appointment_id) {
        await supabase
          .from("appointments")
          .update({
            status: "cancelled",
            cancelled_by: "client",
            cancellation_reason: "rejected_invitation",
            cancelled_at: new Date().toISOString(),
          })
          .eq("id", invData.appointment_id);
      }

      setResponded(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject appointment";
      setError(message);
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </main>
    );
  }

  if (!invitation) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Invitation Not Found</h1>
          <p className="text-gray-600">
            This invitation link is invalid or has expired.
          </p>
        </div>
      </main>
    );
  }

  const appointmentDate = new Date(invitation.appointment?.scheduled_start!);
  const isExpired = new Date() > new Date(invitation.expires_at);

  if (responded) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md bg-white rounded-lg p-8 shadow">
          <div className="text-5xl mb-4">
            {invitation.status === "accepted" ? "✅" : "❌"}
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {invitation.status === "accepted"
              ? "Appointment Confirmed!"
              : "Appointment Cancelled"}
          </h1>
          <p className="text-gray-600">
            {invitation.status === "accepted"
              ? "Thank you for confirming your appointment. See you soon!"
              : "Your appointment has been cancelled."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Appointment Invitation</h1>
        <p className="text-gray-600 mb-6">
          Hello {invitation.sent_to_name}! Please confirm your appointment with{" "}
          {invitation.provider?.business_name}.
        </p>

        {/* Appointment details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-4 text-sm">
          <div>
            <p className="text-gray-600 text-xs">DATE & TIME</p>
            <p className="font-semibold text-lg">
              {appointmentDate.toLocaleDateString([], {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-gray-600">
              {appointmentDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {new Date(invitation.appointment?.scheduled_end!).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              )}
            </p>
          </div>

          {invitation.appointment?.services && invitation.appointment.services.length > 0 && (
            <div>
              <p className="text-gray-600 text-xs">SERVICES</p>
              <ul className="space-y-1">
                {invitation.appointment.services.map((service, idx) => (
                  <li key={idx} className="font-sm">
                    {service.service?.name} – $
                    {service.service?.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {invitation.appointment?.notes && (
            <div>
              <p className="text-gray-600 text-xs">NOTES</p>
              <p className="italic">{invitation.appointment.notes}</p>
            </div>
          )}
        </div>

        {isExpired && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-6">
            ⚠️ This invitation has expired.
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleReject}
            disabled={responding || isExpired}
            variant="outline"
            className="flex-1 text-red-600"
          >
            {responding ? "..." : "Decline"}
          </Button>
          <Button
            onClick={handleAccept}
            disabled={responding || isExpired}
            className="flex-1"
          >
            {responding ? "..." : "Confirm"}
          </Button>
        </div>

        <p className="text-xs text-gray-600 text-center mt-6">
          If you have questions, contact {invitation.provider?.business_name}{" "}
          directly.
        </p>
      </div>
    </main>
  );
}
