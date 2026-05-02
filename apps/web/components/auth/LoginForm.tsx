"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const { signIn, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
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

    if (!validateEmail(formData.email)) {
      setFormError("Por favor ingresa un email válido");
      return;
    }
    if (!formData.password) {
      setFormError("La contraseña es requerida");
      return;
    }

    const result = await signIn(formData.email, formData.password);

    if (result.success) {
      router.push("/dashboard");
    } else {
      let errorMsg = result.error || "Error al iniciar sesión";
      if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
        errorMsg = "Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.";
      }
      setFormError(errorMsg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
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
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </Button>

      <div className="flex gap-3 text-xs text-gray-600 text-center">
        <button
          type="button"
          onClick={() => router.push("/registro")}
          className="flex-1 text-blue-600 hover:underline"
        >
          ¿No tienes cuenta? Regístrate
        </button>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="flex-1 text-blue-600 hover:underline"
        >
          ¿Olvidé mi contraseña?
        </button>
      </div>
    </form>
  );
}
