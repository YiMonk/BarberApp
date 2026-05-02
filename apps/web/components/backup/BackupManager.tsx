"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HardDrive, Download, RotateCcw, Save, Calendar } from "lucide-react";

interface Backup {
  id: string;
  date: string;
  size: string;
  status: "completed" | "in_progress" | "failed";
  type: "automatic" | "manual";
}

interface BackupManagerProps {
  providerId: string;
}

export function BackupManager({ providerId }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([
    {
      id: "bak-001",
      date: "2025-02-15 14:30:00",
      size: "125.5 MB",
      status: "completed",
      type: "automatic",
    },
    {
      id: "bak-002",
      date: "2025-02-14 14:30:00",
      size: "124.2 MB",
      status: "completed",
      type: "automatic",
    },
    {
      id: "bak-003",
      date: "2025-02-13 10:15:00",
      size: "120.8 MB",
      status: "completed",
      type: "manual",
    },
  ]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleCreateBackup = async () => {
    setCreating(true);

    setTimeout(() => {
      const newBackup: Backup = {
        id: `bak-${Date.now()}`,
        date: new Date().toLocaleString("es-ES"),
        size: "126.3 MB",
        status: "completed",
        type: "manual",
      };
      setBackups([newBackup, ...backups]);
      setCreating(false);
    }, 2000);
  };

  const handleRestore = (backupId: string) => {
    setRestoring(true);

    setTimeout(() => {
      setRestoring(false);
      alert(`Respaldo ${backupId} restaurado exitosamente`);
    }, 2000);
  };

  const handleDownload = (backupId: string) => {
    const element = document.createElement("a");
    element.setAttribute("href", `data:text/plain;charset=utf-8,backup_${backupId}`);
    element.setAttribute("download", `backup_${backupId}.zip`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <HardDrive className="w-6 h-6" />
          Gestión de Respaldos
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Respaldos Totales</p>
            <p className="text-3xl font-bold text-blue-600">{backups.length}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Tamaño Total</p>
            <p className="text-3xl font-bold text-green-600">370 MB</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Último Respaldo</p>
            <p className="text-sm font-bold text-purple-600">Hace 1 día</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Configuración Automática</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              Respaldos automáticos diarios
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked className="w-4 h-4" />
              Retención de 30 días
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4" />
              Notificar si falla el respaldo
            </label>
          </div>
        </div>

        <Button
          onClick={handleCreateBackup}
          disabled={creating}
          className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
        >
          <Save className="w-4 h-4 mr-2" />
          {creating ? "Creando..." : "Crear Respaldo Manual"}
        </Button>
      </div>

      {backups.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Respaldos Disponibles</h3>
          </div>

          <div className="divide-y">
            {backups.map((backup) => (
              <div key={backup.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{backup.date}</p>
                      <p className="text-sm text-gray-600">{backup.size}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        backup.status
                      )}`}
                    >
                      {backup.status === "completed"
                        ? "Completado"
                        : backup.status === "in_progress"
                        ? "En progreso"
                        : "Fallo"}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {backup.type === "automatic" ? "Automático" : "Manual"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(backup.id)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    onClick={() => handleRestore(backup.id)}
                    disabled={restoring}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {restoring ? "Restaurando..." : "Restaurar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Los respaldos se cifran y almacenan de forma segura. La restauración
          reemplazará todos los datos actuales con los del respaldo seleccionado.
        </p>
      </div>
    </div>
  );
}
