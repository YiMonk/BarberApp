"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateEmail(email)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) {
        let errorMsg = resetError.message;
        if (errorMsg.includes("rate limit") || errorMsg.includes("429")) {
          errorMsg = "Demasiados intentos. Por favor espera unos minutos antes de intentar de nuevo.";
        }
        setError(errorMsg);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError("Error al enviar el email de recuperación");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 w-full max-w-md">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <h3 className="font-semibold text-green-900 mb-2">
            ✅ Email Enviado
          </h3>
          <p className="text-sm text-green-700 mb-4">
            Se ha enviado un enlace de recuperación a {email}.
            Por favor revisa tu bandeja de entrada (y spam).
          </p>
          <p className="text-xs text-green-600">
            El enlace expirará en 24 horas.
          </p>
        </div>
        <Button
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Volver a Iniciar Sesión
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <div>
        <p className="text-sm text-gray-600 mb-4">
          Ingresa tu email y te enviaremos un enlace para recuperar tu contraseña.
        </p>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="w-full px-3 py-2 border rounded-md text-sm"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Enviando..." : "Enviar Enlace de Recuperación"}
      </Button>

      <p className="text-xs text-gray-600 text-center">
        ¿Ya tienes la contraseña?{" "}
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="text-blue-600 hover:underline"
        >
          Vuelve a iniciar sesión
        </button>
      </p>
    </form>
  );
}
