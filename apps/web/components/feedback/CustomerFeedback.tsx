"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, Send, Download } from "lucide-react";

interface FeedbackEntry {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  status: "new" | "reviewed" | "resolved";
}

interface CustomerFeedbackProps {
  providerId: string;
}

export function CustomerFeedback({ providerId }: CustomerFeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([
    {
      id: "fb-001",
      clientName: "Juan García",
      rating: 5,
      comment: "Excelente servicio, muy rápido y profesional",
      date: "2025-02-15",
      status: "new",
    },
    {
      id: "fb-002",
      clientName: "María López",
      rating: 4,
      comment: "Buena atención, pero esperé un poco más de lo esperado",
      date: "2025-02-14",
      status: "reviewed",
    },
    {
      id: "fb-003",
      clientName: "Pedro Rodríguez",
      rating: 3,
      comment: "El servicio fue okay, se puede mejorar",
      date: "2025-02-13",
      status: "reviewed",
    },
  ]);

  const [newFeedback, setNewFeedback] = useState("");
  const [newRating, setNewRating] = useState(5);

  const averageRating = (
    feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
  ).toFixed(1);

  const handleAddFeedback = () => {
    if (!newFeedback.trim()) return;

    const feedback: FeedbackEntry = {
      id: `fb-${Date.now()}`,
      clientName: "Nuevo Feedback",
      rating: newRating,
      comment: newFeedback,
      date: new Date().toISOString().split("T")[0],
      status: "new",
    };

    setFeedbacks([feedback, ...feedbacks]);
    setNewFeedback("");
    setNewRating(5);
  };

  const handleStatusChange = (id: string, newStatus: FeedbackEntry["status"]) => {
    setFeedbacks(feedbacks.map((f) => (f.id === id ? { ...f, status: newStatus } : f)));
  };

  const handleExportFeedback = () => {
    const csv = [
      ["Fecha", "Cliente", "Calificación", "Comentario", "Estado"].join(","),
      ...feedbacks.map((f) =>
        [f.date, f.clientName, f.rating, `"${f.comment}"`, f.status].join(",")
      ),
    ].join("\n");

    const element = document.createElement("a");
    element.setAttribute("href", `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
    element.setAttribute("download", "feedback.csv");
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          Retroalimentación de Clientes
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total de Feedbacks</p>
            <p className="text-3xl font-bold text-blue-600">{feedbacks.length}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Calificación Promedio</p>
            <p className="text-3xl font-bold text-yellow-600">{averageRating}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Nuevos</p>
            <p className="text-3xl font-bold text-purple-600">
              {feedbacks.filter((f) => f.status === "new").length}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Resueltos</p>
            <p className="text-3xl font-bold text-green-600">
              {feedbacks.filter((f) => f.status === "resolved").length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Agregar Retroalimentación</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Calificación</label>
            <div className="flex gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setNewRating(i + 1)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 cursor-pointer transition ${
                      i < newRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Comentario</label>
            <textarea
              placeholder="Escribe tu feedback aquí..."
              value={newFeedback}
              onChange={(e) => setNewFeedback(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-24"
            />
          </div>

          <Button onClick={handleAddFeedback} className="w-full bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            Enviar
          </Button>
        </div>
      </div>

      {feedbacks.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Feedback Reciente</h3>
            <Button onClick={handleExportFeedback} className="bg-gray-200 hover:bg-gray-300 text-gray-900">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{feedback.clientName}</p>
                    <p className="text-sm text-gray-600">{feedback.date}</p>
                  </div>
                  <div className="flex gap-1">{renderStars(feedback.rating)}</div>
                </div>

                <p className="text-gray-700 mb-3">{feedback.comment}</p>

                <div className="flex gap-2">
                  <select
                    value={feedback.status}
                    onChange={(e) => handleStatusChange(feedback.id, e.target.value as FeedbackEntry["status"])}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    <option value="new">Nuevo</option>
                    <option value="reviewed">Revisado</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      feedback.status === "new"
                        ? "bg-blue-100 text-blue-700"
                        : feedback.status === "reviewed"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {feedback.status === "new"
                      ? "Nuevo"
                      : feedback.status === "reviewed"
                      ? "Revisado"
                      : "Resuelto"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
