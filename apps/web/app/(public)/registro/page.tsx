import { RegisterForm } from "@/components/auth/RegisterForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Registrarse | Barberos SaaS",
  description: "Crea tu cuenta profesional",
};

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link 
          href="/" 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Barberos SaaS
          </h1>
          <p className="text-gray-600 text-center mb-8 text-sm">
            Gestiona tu agenda y fidelización de clientes
          </p>

          <RegisterForm />

          <div className="mt-8 pt-8 border-t">
            <p className="text-xs text-gray-600 text-center">
              Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
