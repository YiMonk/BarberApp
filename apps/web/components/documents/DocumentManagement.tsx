"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Eye, Share2 } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  category: string;
  status: "active" | "archived" | "expired";
}

interface DocumentManagementProps {
  providerId: string;
}

export function DocumentManagement({ providerId }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc-001",
      name: "Política de Privacidad",
      type: "PDF",
      size: "245 KB",
      uploadedBy: "Admin",
      date: "2025-01-15",
      category: "Legal",
      status: "active",
    },
    {
      id: "doc-002",
      name: "Términos de Servicio",
      type: "PDF",
      size: "180 KB",
      uploadedBy: "Admin",
      date: "2025-01-15",
      category: "Legal",
      status: "active",
    },
    {
      id: "doc-003",
      name: "Contrato de Empleado",
      type: "DOCX",
      size: "95 KB",
      uploadedBy: "Manager",
      date: "2025-02-01",
      category: "RH",
      status: "active",
    },
    {
      id: "doc-004",
      name: "Guía de Procedimientos",
      type: "PDF",
      size: "512 KB",
      uploadedBy: "Admin",
      date: "2024-12-20",
      category: "Operaciones",
      status: "archived",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const categories = ["Todos", "Legal", "RH", "Operaciones", "Financiero"];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "archived":
        return "bg-gray-100 text-gray-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "PDF":
        return "bg-red-50 border-red-200 text-red-700";
      case "DOCX":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "XLS":
        return "bg-green-50 border-green-200 text-green-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  const activeCount = documents.filter((d) => d.status === "active").length;
  const totalSize = "3.2 MB";

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="w-6 h-6" />
          Gestión de Documentos
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Documentos</p>
            <p className="text-3xl font-bold text-blue-600">{documents.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Categorías</p>
            <p className="text-3xl font-bold text-purple-600">{categories.length - 1}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Tamaño Total</p>
            <p className="text-3xl font-bold text-yellow-600">{totalSize}</p>
          </div>
        </div>

        <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
          <Upload className="w-4 h-4 mr-2" />
          Subir Nuevo Documento
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
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

      {filteredDocs.length > 0 ? (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 flex-1">
                  <div className={`px-3 py-1 rounded font-semibold text-sm border ${getTypeColor(doc.type)}`}>
                    {doc.type}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{doc.name}</p>
                    <p className="text-xs text-gray-600">
                      Subido por {doc.uploadedBy} el {doc.date}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(doc.status)}`}>
                  {doc.status === "active" ? "Activo" : doc.status === "archived" ? "Archivado" : "Expirado"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>{doc.size}</span>
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">{doc.category}</span>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver
                </Button>
                <Button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Descargar
                </Button>
                <Button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
                <button className="p-2 hover:bg-red-50 rounded text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-8 text-center">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No hay documentos que coincidan con tu búsqueda</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Información de Documentos</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Los documentos se almacenan de forma segura con encriptación</li>
          <li>• Puedes compartir documentos con clientes o personal</li>
          <li>• El historial de cambios se mantiene automáticamente</li>
          <li>• Los documentos archivados se pueden recuperar</li>
        </ul>
      </div>
    </div>
  );
}
