"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useReviews } from "@/hooks/useReviews";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const { reviews, loading, error, fetchReviews, deleteReview, calculateStats } =
    useReviews(providerId);
  const [stats, setStats] = useState<ReturnType<typeof calculateStats> | null>(null);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (err) {
        console.error("Error fetching provider:", err);
        return;
      }

      setProviderId(data.id);
    };

    fetchProviderId();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) {
      fetchReviews();
    }
  }, [providerId, fetchReviews]);

  useEffect(() => {
    if (reviews.length > 0) {
      setStats(calculateStats(reviews));
    }
  }, [reviews, calculateStats]);

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    const result = await deleteReview(reviewId);
    if (result.success) {
      setStats(calculateStats(reviews.filter((r) => r.id !== reviewId)));
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Reseñas de Clientes</h1>
        <p className="text-gray-600 mt-2">
          Gestiona y ve reseñas de tus clientes
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {loading && reviews.length === 0 ? (
        <div className="text-center text-gray-600 py-8">Cargando reseñas...</div>
      ) : (
        <div className="bg-white p-6 rounded-lg border">
          <ReviewsList
            reviews={reviews}
            stats={stats || undefined}
            isProvider={true}
            onDelete={handleDelete}
            loading={loading}
          />
        </div>
      )}

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Cómo funciona:</strong> Tus clientes pueden dejar reseñas después
          de completar sus citas. Su retroalimentación te ayuda a mejorar tu servicio
          y construir confianza con clientes potenciales.
        </p>
      </div>
    </main>
  );
}
