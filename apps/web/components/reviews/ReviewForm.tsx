"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface ReviewFormProps {
  clientName: string;
  onSubmit: (rating: number, comment: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

export function ReviewForm({
  clientName,
  onSubmit,
  onCancel,
  loading = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (rating === 0) {
      setError("Por favor selecciona una calificación");
      return;
    }

    setIsSubmitting(true);
    const result = await onSubmit(rating, comment);

    if (!result.success) {
      setError(result.error || "Error al crear la reseña");
      setIsSubmitting(false);
    } else {
      // Success, form will be closed by parent
      onCancel();
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <div>
        <p className="text-sm text-gray-600 mb-2">
          Califica tu experiencia con {clientName}
        </p>

        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Comparte tu experiencia..."
          rows={4}
          maxLength={500}
          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/500 caracteres
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          disabled={loading || isSubmitting}
          variant="outline"
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading || isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Enviando..." : "Enviar Reseña"}
        </Button>
      </div>
    </div>
  );
}
