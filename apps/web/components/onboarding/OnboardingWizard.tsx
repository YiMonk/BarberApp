"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function OnboardingWizard({ userId }: { userId: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    whatsapp_number: "",
    location: "",
    opening_time: "09:00",
    closing_time: "18:00",
  });

  const steps: Step[] = [
    {
      id: 1,
      title: "Información del Negocio",
      description: "Cuéntanos sobre tu negocio",
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nombre del Negocio</label>
            <input
              type="text"
              value={formData.business_name}
              onChange={(e) =>
                setFormData({ ...formData, business_name: e.target.value })
              }
              placeholder="Mi Barbería"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Descripción</label>
            <textarea
              placeholder="Descripción corta de tu negocio..."
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: "Contacto y Ubicación",
      description: "Cómo pueden contactarte",
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Número de WhatsApp
            </label>
            <input
              type="tel"
              value={formData.whatsapp_number}
              onChange={(e) =>
                setFormData({ ...formData, whatsapp_number: e.target.value })
              }
              placeholder="+56 9 1234 5678"
              className="w-full px-3 py-2 border rounded-md"
            />
            <p className="text-xs text-gray-500 mt-1">
              Los clientes podrán contactarte por aquí
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Ubicación</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Calle, número, ciudad"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: "Horario de Atención",
      description: "Establece tus horas de trabajo",
      component: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Apertura
              </label>
              <input
                type="time"
                value={formData.opening_time}
                onChange={(e) =>
                  setFormData({ ...formData, opening_time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Cierre
              </label>
              <input
                type="time"
                value={formData.closing_time}
                onChange={(e) =>
                  setFormData({ ...formData, closing_time: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
            Tu horario está configurado para todos los días. Podrás ajustar
            excepciones después.
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Servicios Iniciales",
      description: "Crea tus primeros servicios",
      component: (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Puedes agregar todos tus servicios después del onboarding. Por ahora,
            nos gustaría crear un servicio inicial.
          </p>
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del Servicio
            </label>
            <input
              type="text"
              placeholder="Ej: Corte de Cabello"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Duración (minutos)
              </label>
              <input
                type="number"
                placeholder="30"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Precio</label>
              <input
                type="number"
                placeholder="15000"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar onboarding
      setLoading(true);
      try {
        const { error } = await supabase
          .from("provider_accounts")
          .update({ onboarding_completed: true })
          .eq("auth_user_id", userId);

        if (error) throw error;

        router.push("/dashboard");
      } catch (err) {
        console.error("Error completing onboarding:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Configuración Inicial</h1>
          <span className="text-gray-600">
            Paso {currentStep + 1} de {steps.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">{step.title}</h2>
          <p className="text-gray-600">{step.description}</p>
        </div>

        {/* Form Content */}
        <div className="mb-8">{step.component}</div>

        {/* Navigation */}
        <div className="flex gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0 || loading}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>

          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalizar
              </>
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Steps Indicator */}
        <div className="mt-8 flex gap-2 justify-center">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentStep ? "bg-blue-600 w-8" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
