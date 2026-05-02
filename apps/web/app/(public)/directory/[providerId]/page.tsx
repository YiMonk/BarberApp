"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePublicProviders } from "@/hooks/usePublicProviders";
import { useReviews } from "@/hooks/useReviews";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProviderDetails {
  id: string;
  business_name: string;
  display_name: string;
  bio?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string | null;
  services?: Array<{
    id: string;
    name: string;
    duration_minutes: number;
    price: number;
  }>;
  averageRating?: number;
  totalReviews?: number;
}

export default function ProviderDetailPage() {
  const params = useParams();
  const providerId = params.providerId as string;
  const { getProviderDetails } = usePublicProviders();
  const { reviews: allReviews, fetchReviews, calculateStats } = useReviews(providerId);

  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReturnType<typeof calculateStats> | null>(null);

  useEffect(() => {
    const loadProvider = async () => {
      setLoading(true);
      const details = await getProviderDetails(providerId);
      if (details) {
        setProvider(details);
      }
      setLoading(false);
    };

    loadProvider();
  }, [providerId, getProviderDetails]);

  useEffect(() => {
    if (providerId) {
      fetchReviews();
    }
  }, [providerId, fetchReviews]);

  useEffect(() => {
    if (allReviews.length > 0) {
      setStats(calculateStats(allReviews));
    }
  }, [allReviews, calculateStats]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center text-gray-600">Loading provider...</div>
      </main>
    );
  }

  if (!provider) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Provider Not Found</h1>
          <p className="text-gray-600 mb-4">This provider doesn't exist or is no longer available.</p>
          <Link href="/directory">
            <Button>Back to Directory</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <Link href="/directory" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Directory
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex gap-6 mb-6">
          {provider.avatar_url && (
            <img
              src={provider.avatar_url}
              alt={provider.business_name}
              className="w-24 h-24 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {provider.business_name}
            </h1>
            <p className="text-lg text-gray-600">{provider.display_name}</p>

            {provider.totalReviews > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(provider.averageRating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium text-gray-900">
                  {provider.averageRating}
                </span>
                <span className="text-gray-600">
                  ({provider.totalReviews} review{provider.totalReviews !== 1 ? "s" : ""})
                </span>
              </div>
            )}
          </div>
        </div>

        {provider.bio && (
          <p className="text-gray-700 leading-relaxed mb-4">{provider.bio}</p>
        )}

        {/* Contact info */}
        <div className="flex flex-wrap gap-4">
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Phone className="w-4 h-4" />
              {provider.phone}
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <Mail className="w-4 h-4" />
              {provider.email}
            </a>
          )}
        </div>
      </div>

      {/* Services */}
      {provider.services && provider.services.length > 0 && (
        <div className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Services</h2>
          <div className="space-y-3">
            {provider.services.map((service) => (
              <div
                key={service.id}
                className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">
                    {service.duration_minutes} minutes
                  </p>
                </div>
                <span className="font-bold text-gray-900">
                  ${service.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="mb-8">
        <Link href={`/confirm-appointment`}>
          <Button size="lg" className="w-full md:w-auto">
            Book an Appointment
          </Button>
        </Link>
      </div>

      {/* Reviews */}
      <div className="p-6 bg-white border rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
        <ReviewsList
          reviews={allReviews}
          stats={stats || undefined}
          isProvider={false}
        />
      </div>

      {/* Info box */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Ready to book?</strong> Click the button above to schedule your appointment.
          You can choose your preferred date, time, and services.
        </p>
      </div>
    </main>
  );
}
