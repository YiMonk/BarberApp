"use client";

import { useState } from "react";
import { Award, Trophy, Zap, Gift, Target } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  reward: string;
  date?: string;
}

interface LoyaltyAchievementsProps {
  providerId: string;
}

export function LoyaltyAchievements({ providerId }: LoyaltyAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "ach-001",
      name: "Primeros Pasos",
      description: "Registra tu primer cliente",
      icon: <Zap className="w-6 h-6" />,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      reward: "Insignia de Inicio",
      date: "2025-01-15",
    },
    {
      id: "ach-002",
      name: "Maestra del Negocio",
      description: "Registra 10 clientes",
      icon: <Trophy className="w-6 h-6" />,
      progress: 7,
      maxProgress: 10,
      unlocked: false,
      reward: "Certificado Dorado",
    },
    {
      id: "ach-003",
      name: "Impulsador de Ingresos",
      description: "Alcanza $1000 en ingresos mensuales",
      icon: <Gift className="w-6 h-6" />,
      progress: 750,
      maxProgress: 1000,
      unlocked: false,
      reward: "$100 en crédito",
    },
    {
      id: "ach-004",
      name: "Maestría de Citas",
      description: "Completa 50 citas",
      icon: <Target className="w-6 h-6" />,
      progress: 32,
      maxProgress: 50,
      unlocked: false,
      reward: "Número Premium",
    },
    {
      id: "ach-005",
      name: "Cliente Feliz",
      description: "Obtén 10 reseñas de 5 estrellas",
      icon: <Award className="w-6 h-6" />,
      progress: 8,
      maxProgress: 10,
      unlocked: false,
      reward: "Distintivo de Excelencia",
    },
  ]);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalRewards = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Award className="w-6 h-6" />
          Logros y Recompensas
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Logros Totales</p>
            <p className="text-3xl font-bold text-blue-600">{achievements.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Desbloqueados</p>
            <p className="text-3xl font-bold text-green-600">{unlockedCount}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Recompensas</p>
            <p className="text-3xl font-bold text-purple-600">{totalRewards}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Progreso General</p>
            <p className="text-3xl font-bold text-yellow-600">
              {Math.round((unlockedCount / achievements.length) * 100)}%
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-lg border p-6 transition ${
              achievement.unlocked
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                : "bg-white hover:shadow-md"
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div
                className={`p-3 rounded-lg ${
                  achievement.unlocked
                    ? "bg-yellow-200 text-yellow-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {achievement.icon}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold">{achievement.name}</h3>
                  {achievement.unlocked && (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Desbloqueado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>

                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progreso</span>
                    <span className="font-semibold">
                      {achievement.progress}/{achievement.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        achievement.unlocked ? "bg-green-600" : "bg-blue-600"
                      }`}
                      style={{
                        width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    <strong>Recompensa:</strong> {achievement.reward}
                  </span>
                  {achievement.unlocked && achievement.date && (
                    <span className="text-gray-500">Desbloqueado: {achievement.date}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Próximos Objetivos</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Completa 3 citas más para desbloquear "Maestra del Negocio"</li>
          <li>• Necesitas $250 más para alcanzar "Impulsador de Ingresos"</li>
          <li>• Consigue 2 reseñas de 5 estrellas para "Cliente Feliz"</li>
        </ul>
      </div>
    </div>
  );
}
