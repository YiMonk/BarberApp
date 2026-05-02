import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = {
  title: "Actualizar Contraseña | Barberos SaaS",
  description: "Actualiza tu contraseña",
};

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Barberos SaaS
          </h1>
          <p className="text-gray-600 text-center mb-8 text-sm">
            Actualiza tu contraseña
          </p>

          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
