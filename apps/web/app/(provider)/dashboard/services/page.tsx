"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useServices } from "@/hooks/useServices";
import { ServiceForm } from "@/components/services/ServiceForm";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
  } = useServices(providerId);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  useEffect(() => {
    if (providerId) {
      fetchServices();
    }
  }, [providerId, fetchServices]);

  const handleCreateService = async (data: {
    name: string;
    durationMinutes: number;
    price: number;
    description?: string;
  }) => {
    const result = await createService(
      data.name,
      data.durationMinutes,
      data.price,
      data.description
    );

    if (result.success) {
      setShowForm(false);
    }

    return result;
  };

  const handleUpdateService = async (data: {
    name: string;
    durationMinutes: number;
    price: number;
    description?: string;
  }) => {
    if (!editingId) return { success: false, error: "No service selected" };

    const result = await updateService(editingId, {
      name: data.name,
      duration_minutes: data.durationMinutes,
      price: data.price,
      description: data.description,
    });

    if (result.success) {
      setEditingId(null);
      setShowForm(false);
    }

    return result;
  };

  const handleDeleteService = async (id: string) => {
    setDeleteError(null);
    const result = await deleteService(id);

    if (!result.success) {
      setDeleteError(result.error || "Failed to delete service");
    }
  };

  const editingService =
    editingId && services ? services.find((s) => s.id === editingId) : null;

  if (loading && services.length === 0) {
    return <div className="p-6">Loading services...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services</h1>
          <p className="text-gray-600 mt-1">Manage your service catalog</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          disabled={showForm}
        >
          {showForm ? "Cancel" : "+ Add Service"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {deleteError}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Service" : "New Service"}
          </h2>
          <ServiceForm
            service={editingService}
            onSubmit={editingId ? handleUpdateService : handleCreateService}
            onCancel={() => {
              setShowForm(false);
              setEditingId(null);
            }}
            loading={loading}
          />
        </div>
      )}

      {services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-600">No services yet</p>
          <Button
            onClick={() => setShowForm(true)}
            className="mt-4"
          >
            Create Your First Service
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className="p-4 bg-white border rounded-lg flex justify-between items-center hover:shadow-md transition"
            >
              <div className="flex-1">
                <h3 className="font-semibold">{service.name}</h3>
                {service.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {service.description}
                  </p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span>⏱️ {service.duration_minutes} min</span>
                  <span className="font-semibold text-gray-900">
                    ${service.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingId(service.id);
                    setShowForm(true);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDeleteService(service.id)}
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
