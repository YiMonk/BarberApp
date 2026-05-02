"use client";

import { useEffect, useState } from "react";
import { usePublicProviders } from "@/hooks/usePublicProviders";
import { ProviderCard } from "@/components/directory/ProviderCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function DirectoryPage() {
  const { providers, loading, error, fetchProviders } = usePublicProviders();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProviders, setFilteredProviders] = useState(providers);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProviders(providers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProviders(
        providers.filter(
          (p) =>
            p.business_name.toLowerCase().includes(query) ||
            p.display_name.toLowerCase().includes(query) ||
            (p.bio && p.bio.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, providers]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Encuentra tu Proveedor de Servicios
        </h1>
        <p className="text-lg text-gray-600">
          Explora y agenda citas con proveedores profesionales de tu área
        </p>
      </div>

      {/* Search */}
      <div className="mb-8 relative">
        <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Busca por nombre o servicio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 text-base"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600 py-12">
          Cargando proveedores...
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center text-gray-600 py-12">
          {searchQuery
            ? "No hay proveedores que coincidan con tu búsqueda"
            : "No hay proveedores disponibles aún"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              id={provider.id}
              businessName={provider.business_name}
              displayName={provider.display_name}
              bio={provider.bio}
              avatarUrl={provider.avatar_url}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">
          💡 ¿Listo para agendar?
        </h3>
        <p className="text-sm text-blue-900">
          Haz clic en cualquier proveedor para ver su perfil completo, servicios disponibles,
          horarios y reseñas de clientes. Podrás agendar directamente o solicitar una cita.
        </p>
      </div>
    </main>
  );
}
