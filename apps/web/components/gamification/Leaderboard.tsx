"use client";

import { useGamification } from "@/hooks/useGamification";
import { useEffect, useState } from "react";
import { Medal, Trophy } from "lucide-react";

interface LeaderboardProps {
  limit?: number;
}

export function Leaderboard({ limit = 10 }: LeaderboardProps) {
  const { getLeaderboard } = useGamification();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const result = await getLeaderboard(limit);
      if (result.success) {
        setLeaderboard(result.data || []);
      }
      setLoading(false);
    };

    fetchLeaderboard();
  }, [limit, getLeaderboard]);

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  }

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="text-gray-500 font-semibold">#{rank}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Ranking
        </h2>
      </div>

      <div className="divide-y">
        {leaderboard.map((entry, idx) => (
          <div
            key={entry.client_id}
            className="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold w-12 text-center">
                {getMedalIcon(idx + 1)}
              </div>
              <div>
                <p className="font-semibold">{entry.client_name}</p>
                <p className="text-sm text-gray-600">
                  {entry.badges_count} medallas
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{entry.points}</p>
              <p className="text-sm text-gray-600">puntos</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
