"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useProvider } from "@/hooks/useProvider";
import { Button } from "@/components/ui/button";

export function ProviderSettingsForm() {
  const { user } = useAuthContext();
  const { provider, loading, error, fetchProvider, updateProvider, uploadAvatar } = useProvider(user?.id || null);

  const [formData, setFormData] = useState({
    business_name: "",
    display_name: "",
    phone: "",
    whatsapp_number: "",
    bio: "",
    location: "",
    google_maps_url: "",
  });

  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProvider();
    }
  }, [user?.id, fetchProvider]);

  useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || "",
        display_name: provider.display_name || "",
        phone: provider.phone || "",
        whatsapp_number: provider.whatsapp_number || "",
        bio: provider.bio || "",
        location: provider.location || "",
        google_maps_url: provider.google_maps_url || "",
      });
    }
  }, [provider]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSuccess(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    const result = await uploadAvatar(avatarFile);

    if (result.success) {
      setAvatarFile(null);
      setSuccess(true);
    }
    setUploadingAvatar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    const result = await updateProvider(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!provider) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>
        <div className="flex items-center gap-4">
          {provider.avatar_url ? (
            <img
              src={provider.avatar_url}
              alt={provider.business_name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Sin foto</span>
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload" className="block">
              <Button
                type="button"
                variant="outline"
                asChild
                className="cursor-pointer"
              >
                <span>Seleccionar imagen</span>
              </Button>
            </label>
            {avatarFile && (
              <Button
                onClick={handleUploadAvatar}
                disabled={uploadingAvatar}
                className="ml-2"
              >
                {uploadingAvatar ? "Subiendo..." : "Subir"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Información del Negocio</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Negocio</label>
          <input
            type="text"
            name="business_name"
            value={formData.business_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre Mostrado</label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            placeholder="Tu nombre o sobrenombre (opcional)"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descripción</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Cuéntanos sobre tu negocio..."
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.bio.length}/500 caracteres
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Contacto</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+56 9 1234 5678"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">WhatsApp</label>
          <input
            type="tel"
            name="whatsapp_number"
            value={formData.whatsapp_number}
            onChange={handleChange}
            placeholder="+56 9 1234 5678 (o tu número de negocio)"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Los clientes podrán contactarte por aquí
          </p>
        </div>

        <h3 className="text-lg font-semibold mt-6">Ubicación</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Dirección</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Calle, número, ciudad"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Google Maps (URL)</label>
          <input
            type="url"
            name="google_maps_url"
            value={formData.google_maps_url}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Copia el enlace compartible desde Google Maps
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600">
            ✓ Cambios guardados correctamente
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  );
}
