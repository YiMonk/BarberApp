"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { signUp, loading, error } = useAuth();
  const [userType, setUserType] = useState<"provider" | "client" | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.businessName.trim()) {
      setFormError("El nombre del negocio es requerido");
      return;
    }
    if (!validateEmail(formData.email)) {
      setFormError("Por favor ingresa un email válido (ej: tu@email.com)");
      return;
    }
    if (formData.password.length < 6) {
      setFormError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError("Las contraseñas no coinciden");
      return;
    }

    const result = await signUp(
      formData.email,
      formData.password,
      formData.businessName
    );

    if (result.success) {
      router.push(`/onboarding`);
    } else {
      let errorMsg = result.error || "Error al registrar la cuenta";
      if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
        errorMsg = "Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.";
      }
      setFormError(errorMsg);
    }
  };

  if (!userType) {
    return (
      <div className="space-y-4 w-full max-w-md">
        <p className="text-center text-gray-600 text-sm mb-4">
          ¿Qué tipo de cuenta deseas crear?
        </p>
        <button
          onClick={() => setUserType("provider")}
          className="w-full p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
        >
          <h3 className="font-semibold text-gray-900">💼 Soy Proveedor de Servicios</h3>
          <p className="text-xs text-gray-600 mt-1">
            Barbero, esteticista, masajista, etc.
          </p>
        </button>
        <button
          onClick={() => setUserType("client")}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <h3 className="font-semibold text-gray-900">👤 Soy Cliente</h3>
          <p className="text-xs text-gray-600 mt-1">
            Busco servicios y quiero reservar citas
          </p>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setUserType(null)}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          ← Cambiar tipo de cuenta
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          {userType === "provider" ? "Nombre del Negocio" : "Nombre Completo"}
        </label>
        <input
          type="text"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          placeholder={userType === "provider" ? "Mi Barbería" : "Juan García"}
          className="w-full px-3 py-2 border rounded-md text-sm"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          className="w-full px-3 py-2 border rounded-md text-sm"
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Ej: julio@gmail.com o tu@hotmail.com
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Mínimo 6 caracteres
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Confirmar Contraseña
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••"
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {(formError || error) && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {formError || error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Registrando..." : "Crear Cuenta"}
      </Button>

      <p className="text-xs text-gray-600 text-center">
        ¿Ya tienes cuenta?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-blue-600 hover:underline"
        >
          Inicia sesión
        </button>
      </p>
    </form>
  );
}
