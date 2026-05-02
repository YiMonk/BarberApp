"use client";

import { LoyaltyProgram } from "@/hooks/useLoyalty";
import { Button } from "@/components/ui/button";
import { Award, Gift, Cake, Zap, Trash2 } from "lucide-react";

interface LoyaltyProgramCardProps {
  program: LoyaltyProgram;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  isAdmin?: boolean;
}

const mechanicIcons = {
  punch_card: Award,
  nth_visit_discount: Gift,
  birthday_bonus: Cake,
  time_limited_promo: Zap,
};

const mechanicLabels = {
  punch_card: "Tarjeta de Puntos",
  nth_visit_discount: "Descuento por Visita",
  birthday_bonus: "Bono de Cumpleaños",
  time_limited_promo: "Promoción Limitada",
};

const mechanicDescriptions = {
  punch_card: "Gana sellos con cada visita, canjea por recompensas",
  nth_visit_discount: "Obtén descuentos en visitas específicas",
  birthday_bonus: "Descuento especial durante el mes de cumpleaños",
  time_limited_promo: "Promoción por tiempo limitado para todos los clientes",
};

export function LoyaltyProgramCard({
  program,
  onDelete,
  onEdit,
  isAdmin = false,
}: LoyaltyProgramCardProps) {
  const Icon = mechanicIcons[program.mechanic];

  return (
    <div className="p-6 bg-white border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">{program.name}</h3>
            <p className="text-sm text-gray-600">
              {mechanicLabels[program.mechanic]}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(program.id)}
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(program.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {program.description && (
        <p className="text-sm text-gray-700 mb-3">{program.description}</p>
      )}

      <p className="text-xs text-gray-600 mb-3">
        {mechanicDescriptions[program.mechanic]}
      </p>

      {/* Status badge */}
      <div className="flex items-center gap-2">
        {program.is_active ? (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            Activo
          </span>
        ) : (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
            Inactivo
          </span>
        )}

        {program.ends_at &&
          new Date(program.ends_at) < new Date() && (
            <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
              Expirado
            </span>
          )}
      </div>
    </div>
  );
}
