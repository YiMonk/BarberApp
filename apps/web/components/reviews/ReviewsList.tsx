"use client";

import { Review, ReviewStats } from "@/hooks/useReviews";
import { Button } from "@/components/ui/button";
import { Star, Trash2 } from "lucide-react";

interface ReviewsListProps {
  reviews: Review[];
  stats?: ReviewStats;
  isProvider?: boolean;
  onDelete?: (reviewId: string) => void;
  loading?: boolean;
}

export function ReviewsList({
  reviews,
  stats,
  isProvider = false,
  onDelete,
  loading = false,
}: ReviewsListProps) {
  if (reviews.length === 0 && !stats) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Sin reseñas aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats summary */}
      {stats && stats.totalReviews > 0 && (
        <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="text-4xl font-bold text-gray-900">
                  {stats.averageRating}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Based on {stats.totalReviews} review
                {stats.totalReviews !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Rating distribution */}
            <div className="space-y-1 text-sm">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-4">{rating}★</span>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats.totalReviews > 0
                            ? (stats.ratingDistribution[rating] /
                              stats.totalReviews) *
                            100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 w-4">
                    {stats.ratingDistribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">
                    {review.client?.first_name}{" "}
                    {review.client?.last_name ? review.client.last_name[0] + "." : ""}
                  </span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>

              {isProvider && onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(review.id)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            {review.comment && (
              <p className="text-sm text-gray-700 leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
