import { useCallback, useState } from "react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number; // número de citas o puntos requeridos
  type: "visits" | "points" | "referrals" | "reviews";
  reward?: string; // qué ganan por lograr esto
}

export interface ClientAchievement {
  client_id: string;
  achievement_id: string;
  unlockedAt: string;
  certificate_url?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-visit",
    name: "Primer Paso",
    description: "Completar tu primera cita",
    icon: "👟",
    requirement: 1,
    type: "visits",
    reward: "Descuento 10% en próxima cita",
  },
  {
    id: "loyal-customer",
    name: "Cliente Leal",
    description: "Completar 10 citas",
    icon: "⭐",
    requirement: 10,
    type: "visits",
    reward: "Corte gratis",
  },
  {
    id: "superfan",
    name: "Superfan",
    description: "Completar 25 citas",
    icon: "🚀",
    requirement: 25,
    type: "visits",
    reward: "Descuento permanente 15%",
  },
  {
    id: "reviewer",
    name: "Crítico Constructivo",
    description: "Dejar 5 reseñas",
    icon: "📝",
    requirement: 5,
    type: "reviews",
    reward: "Acceso a servicios VIP",
  },
  {
    id: "ambassador",
    name: "Embajador",
    description: "Referir 5 clientes",
    icon: "📢",
    requirement: 5,
    type: "referrals",
    reward: "Acceso a ofertas exclusivas",
  },
];

export function useLoyaltyAchievements() {
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);

  const getAchievementProgress = useCallback(
    (achievement: Achievement, currentProgress: number): number => {
      return Math.min(100, (currentProgress / achievement.requirement) * 100);
    },
    []
  );

  const checkUnlockedAchievements = useCallback(
    (clientStats: {
      visitCount: number;
      pointsTotal: number;
      referralsCount: number;
      reviewsCount: number;
    }): Achievement[] => {
      return achievements.filter((ach) => {
        switch (ach.type) {
          case "visits":
            return clientStats.visitCount >= ach.requirement;
          case "points":
            return clientStats.pointsTotal >= ach.requirement;
          case "referrals":
            return clientStats.referralsCount >= ach.requirement;
          case "reviews":
            return clientStats.reviewsCount >= ach.requirement;
          default:
            return false;
        }
      });
    },
    [achievements]
  );

  const generateCertificate = useCallback(
    async (clientName: string, achievement: Achievement): Promise<string> => {
      // En producción, usar una librería como html2pdf o jsPDF
      const html = `
        <div style="text-align: center; padding: 40px; font-family: serif;">
          <h1>Certificado de Logro</h1>
          <p style="font-size: 24px; margin: 20px 0;">${achievement.icon} ${achievement.name}</p>
          <p style="font-size: 18px; margin: 20px 0;">
            Se otorga este certificado a
          </p>
          <h2 style="font-size: 28px; text-decoration: underline; margin: 30px 0;">
            ${clientName}
          </h2>
          <p style="font-size: 16px; margin: 20px 0;">
            Por alcanzar el logro: ${achievement.description}
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 40px;">
            Fecha: ${new Date().toLocaleDateString("es-CL")}
          </p>
          <p style="color: #666; font-size: 14px;">
            Barberos SaaS
          </p>
        </div>
      `;

      return html;
    },
    []
  );

  const downloadCertificate = useCallback(
    async (clientName: string, achievement: Achievement) => {
      const html = await generateCertificate(clientName, achievement);

      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `certificado-${achievement.id}.html`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [generateCertificate]
  );

  return {
    achievements,
    loading,
    getAchievementProgress,
    checkUnlockedAchievements,
    generateCertificate,
    downloadCertificate,
  };
}
