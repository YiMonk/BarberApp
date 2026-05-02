"use client";

import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnalyticsDashboard } from "@/components/provider/AnalyticsDashboard";

export default function AnalyticsPage() {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analíticas</h1>
        <p className="text-gray-600 mt-2">
          Visualiza métricas de tu negocio, citas y clientes
        </p>
      </div>

      <AnalyticsDashboard />
    </main>
  );
}
