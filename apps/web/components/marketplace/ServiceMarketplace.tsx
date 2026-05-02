"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Eye, Share2, Heart } from "lucide-react";

interface MarketplaceService {
  id: string;
  name: string;
  description: string;
  provider: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
  featured: boolean;
  views: number;
}

interface ServiceMarketplaceProps {
  providerId: string;
}

export function ServiceMarketplace({ providerId }: ServiceMarketplaceProps) {
  const [services, setServices] = useState<MarketplaceService[]>([
    {
      id: "srv-001",
      name: "Corte Premium",
      description: "Corte de cabello con técnicas modernas",
      provider: "Tu Barbería",
      price: 35,
      rating: 4.8,
      reviews: 142,
      category: "Peluquería",
      featured: true,
      views: 2340,
    },
    {
      id: "srv-002",
      name: "Afeitado Clásico",
      description: "Afeitado tradicional con navaja recta",
      provider: "Tu Barbería",
      price: 20,
      rating: 4.9,
      reviews: 198,
      category: "Barbería",
      featured: true,
      views: 3120,
    },
    {
      id: "srv-003",
      name: "Paquete Completo",
      description: "Corte + afeitado + cuidado facial",
      provider: "Tu Barbería",
      price: 55,
      rating: 4.7,
      reviews: 87,
      category: "Paquetes",
      featured: false,
      views: 1540,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [newService, setNewService] = useState({ name: "", description: "", price: 0, category: "" });
  const [showForm, setShowForm] = useState(false);

  const categories = ["Todos", "Peluquería", "Barbería", "Paquetes", "Cuidado Facial"];

  const filteredServices = services.filter(
    (s) => selectedCategory === "Todos" || s.category === selectedCategory
  );

  const handlePublish = () => {
    if (!newService.name || !newService.description || !newService.category) return;

    const service: MarketplaceService = {
      id: `srv-${Date.now()}`,
      name: newService.name,
      description: newService.description,
      provider: "Tu Barbería",
      price: newService.price,
      rating: 0,
      reviews: 0,
      category: newService.category,
      featured: false,
      views: 0,
    };

    setServices([...services, service]);
    setNewService({ name: "", description: "", price: 0, category: "" });
    setShowForm(false);
  };

  const totalViews = services.reduce((sum, s) => sum + s.views, 0);
  const averageRating = (services.reduce((sum, s) => sum + s.rating, 0) / services.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Marketplace de Servicios
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Servicios Publicados</p>
            <p className="text-3xl font-bold text-blue-600">{services.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Calificación Promedio</p>
            <p className="text-3xl font-bold text-green-600">{averageRating}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Vistas Totales</p>
            <p className="text-3xl font-bold text-purple-600">{totalViews.toLocaleString()}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Destacados</p>
            <p className="text-3xl font-bold text-yellow-600">
              {services.filter((s) => s.featured).length}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="w-full bg-blue-600 hover:bg-blue-700 mb-4"
        >
          + Publicar Nuevo Servicio
        </Button>

        {showForm && (
          <div className="border rounded-lg p-4 bg-gray-50 space-y-3 mb-4">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <textarea
              placeholder="Descripción"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <select
              value={newService.category}
              onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Selecciona categoría</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Precio"
              value={newService.price || ""}
              onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="flex gap-2">
              <Button onClick={handlePublish} className="flex-1 bg-green-600 hover:bg-green-700">
                Publicar
              </Button>
              <Button onClick={() => setShowForm(false)} className="flex-1 bg-gray-400 hover:bg-gray-500">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">Filtrar por Categoría</h3>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-lg border p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.provider}</p>
              </div>
              {service.featured && (
                <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">
                  Destacado
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-3">{service.description}</p>

            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{service.rating}</span>
                <span className="text-yellow-500">★</span>
                <span className="text-gray-600">({service.reviews})</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600">
                <Eye className="w-4 h-4" />
                <span>{service.views.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-blue-600">${service.price}</p>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Heart className="w-5 h-5 text-gray-400 hover:text-red-500" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Share2 className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
