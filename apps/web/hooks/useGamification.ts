import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  requirement: {
    type: "visits" | "referrals" | "reviews" | "streak" | "custom";
    value: number;
  };
}

export interface Leaderboard {
  rank: number;
  client_id: string;
  client_name: string;
  points: number;
  badges_count: number;
  level: number;
}

export interface PlayerStats {
  client_id: string;
  total_points: number;
  level: number;
  badges: Badge[];
  streak_days: number;
  rank: number;
}

const BADGES: Badge[] = [
  {
    id: "first-visit",
    name: "Primer Viaje",
    description: "Completa tu primera cita",
    icon: "🚀",
    points: 10,
    requirement: { type: "visits", value: 1 },
  },
  {
    id: "streak-7",
    name: "En Racha",
    description: "7 días consecutivos de actividad",
    icon: "🔥",
    points: 50,
    requirement: { type: "streak", value: 7 },
  },
  {
    id: "reviewer",
    name: "Crítico",
    description: "Deja 5 reseñas",
    icon: "✍️",
    points: 30,
    requirement: { type: "reviews", value: 5 },
  },
  {
    id: "ambassador",
    name: "Embajador",
    description: "Refiere 3 amigos",
    icon: "📢",
    points: 100,
    requirement: { type: "referrals", value: 3 },
  },
];

const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 1500, 2500, 4000, 6000, 10000,
];

export function useGamification() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);

  const awardPoints = useCallback(
    async (clientId: string, points: number, reason: string) => {
      setLoading(true);

      try {
        const { error: err } = await supabase
          .from("gamification_points")
          .insert({
            client_id: clientId,
            points,
            reason,
            awarded_at: new Date().toISOString(),
          });

        if (err) throw err;

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error awarding points";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const checkBadgeEligibility = useCallback(
    (clientStats: PlayerStats, badge: Badge): boolean => {
      switch (badge.requirement.type) {
        case "visits":
          // En producción, verificar contra contador de visitas
          return true;
        case "streak":
          return clientStats.streak_days >= badge.requirement.value;
        case "reviews":
          // En producción, verificar contra contador de reseñas
          return true;
        case "referrals":
          // En producción, verificar contra contador de referidos
          return true;
        default:
          return false;
      }
    },
    []
  );

  const unlockBadge = useCallback(
    async (clientId: string, badgeId: string) => {
      setLoading(true);

      try {
        const badge = BADGES.find((b) => b.id === badgeId);
        if (!badge) throw new Error("Badge not found");

        const { error: badgeError } = await supabase
          .from("gamification_badges")
          .insert({
            client_id: clientId,
            badge_id: badgeId,
            unlocked_at: new Date().toISOString(),
          });

        if (badgeError) throw badgeError;

        // Otorgar puntos
        const { error: pointsError } = await supabase
          .from("gamification_points")
          .insert({
            client_id: clientId,
            points: badge.points,
            reason: `Desbloqueó la medalla: ${badge.name}`,
            awarded_at: new Date().toISOString(),
          });

        if (pointsError) throw pointsError;

        return { success: true, badge };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error unlocking badge";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const calculateLevel = useCallback((totalPoints: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPoints >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }, []);

  const getLeaderboard = useCallback(
    async (limit: number = 10) => {
      setLoading(true);

      try {
        const { data, error: err } = await supabase
          .from("gamification_leaderboard")
          .select("*")
          .order("points", { ascending: false })
          .limit(limit);

        if (err) throw err;

        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching leaderboard";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getPlayerStats = useCallback(
    async (clientId: string) => {
      setLoading(true);

      try {
        const { data, error: err } = await supabase
          .from("gamification_stats")
          .select("*")
          .eq("client_id", clientId)
          .single();

        if (err && err.code !== "PGRST116") throw err;

        const playerStats: PlayerStats = data || {
          client_id: clientId,
          total_points: 0,
          level: 1,
          badges: [],
          streak_days: 0,
          rank: 999,
        };

        playerStats.level = calculateLevel(playerStats.total_points);
        setStats(playerStats);

        return { success: true, data: playerStats };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error fetching stats";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [calculateLevel]
  );

  return {
    stats,
    loading,
    error,
    badges: BADGES,
    awardPoints,
    checkBadgeEligibility,
    unlockBadge,
    calculateLevel,
    getLeaderboard,
    getPlayerStats,
  };
}
