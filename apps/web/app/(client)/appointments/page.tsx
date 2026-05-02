"use client";

import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClientAppointmentsHistory } from "@/components/client/ClientAppointmentsHistory";

export default function ClientAppointmentsPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <main className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mis Citas</h1>
        <p className="text-gray-600 mt-2">Ver mis citas próximas y pasadas</p>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <ClientAppointmentsHistory />
      </div>
    </main>
  );
}
