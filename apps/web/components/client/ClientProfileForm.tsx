"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useClientProfile } from "@/hooks/useClientProfile";
import { Button } from "@/components/ui/button";

export function ClientProfileForm() {
  const { user } = useAuthContext();
  const { profile, loading, error, fetchProfile, updateProfile, uploadAvatar } = useClientProfile(
    user?.id || null
  );

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    preferred_notification_method: "push" as "push" | "email" | "sms",
  });

  const [success, setSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        preferred_notification_method: profile.preferred_notification_method || "push",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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

    const result = await updateProfile(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!profile) {
    return <div className="text-center text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Avatar Section */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Foto de Perfil</h3>
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
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
              <Button type="button" variant="outline" asChild className="cursor-pointer">
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

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="text-lg font-semibold">Información Personal</h3>

        <div>
          <label className="block text-sm font-medium mb-1">Nombre Completo</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

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
          <label className="block text-sm font-medium mb-1">Fecha de Nacimiento</label>
          <input
            type="date"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Usada para ofertas de cumpleaños
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Método de Notificación Preferido
          </label>
          <select
            name="preferred_notification_method"
            value={formData.preferred_notification_method}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          >
            <option value="push">Notificaciones Push</option>
            <option value="email">Correo Electrónico</option>
            <option value="sms">SMS</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Cómo prefieres recibir recordatorios de citas
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
