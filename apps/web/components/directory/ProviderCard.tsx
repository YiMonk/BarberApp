"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProviderCardProps {
  id: string;
  businessName: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  averageRating?: number;
  totalReviews?: number;
  servicesCount?: number;
}

export function ProviderCard({
  id,
  businessName,
  displayName,
  bio,
  avatarUrl,
  averageRating = 0,
  totalReviews = 0,
  servicesCount = 0,
}: ProviderCardProps) {
  return (
    <div className="bg-white rounded-lg border hover:shadow-lg transition-shadow overflow-hidden">
      {/* Avatar */}
      {avatarUrl && (
        <div className="h-40 bg-gradient-to-r from-blue-400 to-blue-600 overflow-hidden">
          <img
            src={avatarUrl}
            alt={businessName}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!avatarUrl && (
        <div className="h-40 bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
          <div className="text-4xl text-white font-bold">
            {businessName.charAt(0)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-lg text-gray-900">{businessName}</h3>
          <p className="text-sm text-gray-600">{displayName}</p>
        </div>

        {bio && (
          <p className="text-sm text-gray-700 line-clamp-2">
            {bio}
          </p>
        )}

        {/* Rating and reviews */}
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-900">
              {averageRating}
            </span>
            <span className="text-xs text-gray-600">
              ({totalReviews} reseña{totalReviews !== 1 ? "s" : ""})
            </span>
          </div>
        )}

        {servicesCount > 0 && (
          <p className="text-xs text-gray-600">
            {servicesCount} servicio{servicesCount !== 1 ? "s" : ""}
          </p>
        )}

        {/* CTA Button */}
        <Link href={`/directory/${id}`} className="block">
          <Button className="w-full">Ver Perfil</Button>
        </Link>
      </div>
    </div>
  );
}
