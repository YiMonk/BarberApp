"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useState } from "react";

interface PricingTableProps {
  onSelectPlan?: (tier: string) => void;
}

export function PricingTable({ onSelectPlan }: PricingTableProps) {
  const { plans, upgradePlan } = useSubscriptions(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPlan = async (tier: string) => {
    setLoading(true);
    // await upgradePlan(tier as any, 'monthly');
    onSelectPlan?.(tier);
    setLoading(false);
  };

  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">Planes de Suscripción</h2>
        <p className="text-gray-600">Elige el plan perfecto para tu negocio</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            className={`rounded-lg border-2 p-6 flex flex-col ${
              key === "professional"
                ? "border-blue-600 bg-blue-50 shadow-lg scale-105"
                : "border-gray-200"
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>

            <div className="mb-6">
              {plan.price > 0 ? (
                <>
                  <span className="text-4xl font-bold">${plan.price.toLocaleString()}</span>
                  <span className="text-gray-600">/{plan.billing_cycle === "monthly" ? "mes" : "año"}</span>
                </>
              ) : (
                <span className="text-2xl font-bold">Contactar</span>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSelectPlan(plan.tier)}
              disabled={loading}
              className={`w-full ${
                key === "professional"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              }`}
            >
              {key === "free" ? "Comenzar Gratis" : "Suscribirse"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
