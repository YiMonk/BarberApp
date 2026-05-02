"use client";

import { useComplianceManagement } from "@/hooks/useComplianceManagement";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

interface ComplianceChecklistProps {
  providerId: string;
}

export function ComplianceChecklist({ providerId }: ComplianceChecklistProps) {
  const { createChecklist, getComplianceReport, checklists } = useComplianceManagement(providerId);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newChecklistName, setNewChecklistName] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      const result = await getComplianceReport();
      if (result.success) {
        setReport(result.data);
      }
      setLoading(false);
    };

    fetchReport();
  }, [getComplianceReport]);

  const handleCreateChecklist = async () => {
    if (!newChecklistName.trim()) return;

    await createChecklist(newChecklistName, [
      {
        title: "Elemento 1",
        description: "Descripción del elemento",
        completed: false,
      },
    ]);

    setNewChecklistName("");
    const result = await getComplianceReport();
    if (result.success) {
      setReport(result.data);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Cumplimiento Normativo
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Listas Totales</p>
            <p className="text-3xl font-bold text-blue-600">{report?.totalChecklists || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Promedio Completitud</p>
            <p className="text-3xl font-bold text-green-600">{report?.averageCompletion || 0}%</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Estado General</p>
            <p className="text-lg font-bold text-purple-600">
              {(report?.averageCompletion || 0) >= 80 ? "En Regla" : "Revisar"}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Nombre de nueva lista..."
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <Button onClick={handleCreateChecklist} className="bg-blue-600 hover:bg-blue-700">
            Crear
          </Button>
        </div>
      </div>

      {report?.checklists && report.checklists.length > 0 && (
        <div className="space-y-4">
          {report.checklists.map((checklist: any) => (
            <div key={checklist.id} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{checklist.name}</h3>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Completitud</p>
                  <p className="text-2xl font-bold">{Math.round(checklist.completion_rate)}%</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${checklist.completion_rate}%` }}
                />
              </div>

              <div className="mt-4 space-y-2">
                {checklist.items?.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded">
                    {item.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={item.completed ? "line-through text-gray-500" : ""}>{item.title}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
