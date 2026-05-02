import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Barberos SaaS</h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/registro">
              <Button>Comenzar</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Gestiona tus Citas Profesionalmente
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Administra tu agenda, clientes y programas de fidelización en un solo lugar
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/registro">
              <Button size="lg">Prueba Gratis</Button>
            </Link>
            <Link href="/directory">
              <Button size="lg" variant="outline">Ver Proveedores</Button>
            </Link>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📅 Agenda Inteligente</h3>
            <p className="text-gray-600 text-sm">
              Gestiona tu disponibilidad, establece precios y maneja citas fácilmente
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">👥 Gestión de Clientes</h3>
            <p className="text-gray-600 text-sm">
              Registra historial, notas y preferencias de clientes en un solo sistema
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">🎁 Programas de Fidelización</h3>
            <p className="text-gray-600 text-sm">
              Recompensa clientes frecuentes con tarjetas, descuentos y ofertas especiales
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📱 Notificaciones Push</h3>
            <p className="text-gray-600 text-sm">
              Mantén informados a tus clientes con recordatorios y actualizaciones
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">⭐ Reseñas y Calificaciones</h3>
            <p className="text-gray-600 text-sm">
              Recopila comentarios y construye tu reputación con opiniones de clientes
            </p>
          </div>

          <div className="p-6 bg-white border rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📋 Lista de Espera</h3>
            <p className="text-gray-600 text-sm">
              Notifica automáticamente a clientes cuando se liberen horarios
            </p>
          </div>
        </div>
      </div>

      {/* Directory section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Encuentra un Proveedor de Servicios</h2>
          <p className="text-lg text-gray-600 mb-8">
            Explora nuestro directorio de proveedores profesionales y agenda tu cita
          </p>
          <Link href="/directory">
            <Button size="lg">Ver Directorio</Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2026 Barberos SaaS. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </main>
  );
}
