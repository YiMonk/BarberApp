"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, User, Clock } from "lucide-react";

interface ClientAppointment {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  notes?: string;
  provider: {
    business_name: string;
    location?: string;
  };
  services: Array<{
    name: string;
  }>;
}

export function ClientAppointmentsHistory() {
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
            id,
            scheduled_start,
            scheduled_end,
            status,
            notes,
            provider_accounts (business_name, location),
            appointment_services (services (name))
          `
          )
          .eq("client_profiles.user_id", user.id)
          .order("scheduled_start", { ascending: false });

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setAppointments(
            data.map((apt: any) => ({
              id: apt.id,
              scheduled_start: apt.scheduled_start,
              scheduled_end: apt.scheduled_end,
              status: apt.status,
              notes: apt.notes,
              provider: {
                business_name: apt.provider_accounts?.business_name || "Proveedor",
                location: apt.provider_accounts?.location,
              },
              services: apt.appointment_services?.map((as: any) => as.services) || [],
            }))
          );
        }
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user?.id]);

  const now = new Date();
  const filteredAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.scheduled_start);
    if (filter === "upcoming") return aptDate > now;
    if (filter === "past") return aptDate <= now;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 border-green-200 text-green-700";
      case "attended":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-700";
      case "no_show":
        return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada";
      case "pending_provider_approval":
        return "Pendiente (Proveedor)";
      case "pending_client_approval":
        return "Pendiente (Tuyo)";
      case "attended":
        return "Completada";
      case "cancelled":
        return "Cancelada";
      case "no_show":
        return "No presentado";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-8">Cargando citas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        {(["upcoming", "past", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 font-medium text-sm ${
              filter === f
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {f === "upcoming"
              ? "Próximas"
              : f === "past"
                ? "Pasadas"
                : "Todas"}
          </button>
        ))}
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {filter === "upcoming"
              ? "No tienes citas próximas"
              : filter === "past"
                ? "No tienes citas pasadas"
                : "No tienes citas"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appointment) => {
            const startDate = new Date(appointment.scheduled_start);
            const endDate = new Date(appointment.scheduled_end);
            const isUpcoming = startDate > now;

            return (
              <div
                key={appointment.id}
                className={`p-4 rounded-lg border ${getStatusColor(appointment.status)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {appointment.provider.business_name}
                    </h3>
                    <p className="text-sm opacity-75 mt-1">
                      {getStatusLabel(appointment.status)}
                    </p>
                  </div>
                  {isUpcoming && appointment.status === "confirmed" && (
                    <Button size="sm" variant="outline">
                      Reagendar
                    </Button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 opacity-75">
                    <Calendar className="w-4 h-4" />
                    {startDate.toLocaleDateString("es-CL", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>

                  <div className="flex items-center gap-2 opacity-75">
                    <Clock className="w-4 h-4" />
                    {startDate.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {endDate.toLocaleTimeString("es-CL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {appointment.provider.location && (
                    <div className="flex items-center gap-2 opacity-75">
                      <MapPin className="w-4 h-4" />
                      {appointment.provider.location}
                    </div>
                  )}

                  {appointment.services.length > 0 && (
                    <div className="text-xs opacity-75">
                      <strong>Servicios:</strong> {appointment.services.map((s: any) => s.name).join(", ")}
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="text-xs opacity-75">
                      <strong>Notas:</strong> {appointment.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
