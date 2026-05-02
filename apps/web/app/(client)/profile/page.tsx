"use client";

import { useAuthContext } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";

export default function ClientProfilePage() {
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
        <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
        <p className="text-gray-600 mt-2">Administra tu información y preferencias</p>
      </div>

      <ClientProfileForm />
    </main>
  );
}
