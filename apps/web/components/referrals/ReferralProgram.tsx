"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Users, Gift } from "lucide-react";

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  earnedRewards: number;
}

interface ReferralProgramProps {
  providerId: string;
}

export function ReferralProgram({ providerId }: ReferralProgramProps) {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    completedReferrals: 0,
    earnedRewards: 0,
  });
  const [copied, setCopied] = useState(false);
  const referralCode = `REF-${providerId.substring(0, 8).toUpperCase()}`;
  const referralUrl = `https://app.servicios.com/join?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Share2 className="w-6 h-6" />
          Programa de Referidos
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Total Referidos</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.activeReferrals}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Completados</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedReferrals}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Recompensas</p>
            <p className="text-3xl font-bold text-purple-600">${stats.earnedRewards}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">Tu Código de Referido</h3>

        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-100 mb-2">Comparte tu enlace</p>
          <div className="flex items-center justify-between bg-white/20 rounded px-4 py-3 font-mono text-sm">
            <span className="break-all">{referralUrl}</span>
            <button
              onClick={handleCopyCode}
              className="ml-2 flex-shrink-0"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {copied && (
          <p className="text-blue-100 text-sm">✓ ¡Código copiado al portapapeles!</p>
        )}

        <Button onClick={handleCopyCode} className="w-full bg-white text-blue-600 hover:bg-gray-100">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Enlace
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Cómo Funciona
        </h3>

        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-semibold">Comparte tu código</p>
              <p className="text-sm text-gray-600">Envía tu enlace de referido a amigos y colegas</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-semibold">Ellos se registran</p>
              <p className="text-sm text-gray-600">Cuando se registren usando tu código, se vinculan a ti</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-semibold">Gana recompensas</p>
              <p className="text-sm text-gray-600">Recibe comisiones cuando tus referidos activen un plan pagado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Referidos Recientes</h3>

        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay referidos aún</p>
          <p className="text-sm">Comienza compartiendo tu código para ver referidos aquí</p>
        </div>
      </div>
    </div>
  );
}
