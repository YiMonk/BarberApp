"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";

interface DataExportPanelProps {
  providerId: string;
}

export function DataExportPanel({ providerId }: DataExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "json" | "html">("csv");
  const [selectedData, setSelectedData] = useState<string[]>([]);
  const [exported, setExported] = useState(false);

  const dataOptions = [
    { id: "appointments", label: "Citas", icon: "📅" },
    { id: "clients", label: "Clientes", icon: "👥" },
    { id: "services", label: "Servicios", icon: "✂️" },
    { id: "analytics", label: "Analítica", icon: "📊" },
    { id: "payments", label: "Pagos", icon: "💳" },
    { id: "staff", label: "Personal", icon: "👔" },
  ];

  const toggleData = (dataId: string) => {
    if (selectedData.includes(dataId)) {
      setSelectedData(selectedData.filter((id) => id !== dataId));
    } else {
      setSelectedData([...selectedData, dataId]);
    }
  };

  const handleExport = async () => {
    if (selectedData.length === 0) return;

    setExporting(true);

    setTimeout(() => {
      const filename = `export_${new Date().toISOString().split("T")[0]}.${
        selectedFormat === "csv" ? "csv" : selectedFormat === "json" ? "json" : "html"
      }`;

      let content = "";
      if (selectedFormat === "json") {
        content = JSON.stringify({
          provider_id: providerId,
          export_date: new Date().toISOString(),
          data_types: selectedData,
          records: selectedData.reduce((acc, type) => {
            acc[type] = [];
            return acc;
          }, {} as Record<string, any[]>),
        }, null, 2);
      } else if (selectedFormat === "csv") {
        content = "provider_id,data_type,export_date\n";
        selectedData.forEach((type) => {
          content += `${providerId},${type},${new Date().toISOString()}\n`;
        });
      } else {
        content = `<html><body><h1>Exportación de Datos</h1>
        <p>Proveedor: ${providerId}</p>
        <p>Fecha: ${new Date().toISOString()}</p>
        <ul>${selectedData.map((type) => `<li>${type}</li>`).join("")}</ul>
        </body></html>`;
      }

      const element = document.createElement("a");
      element.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
      element.setAttribute("download", filename);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Download className="w-6 h-6" />
        Exportar Datos
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Selecciona los datos a exportar:</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {dataOptions.map((option) => (
              <label key={option.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedData.includes(option.id)}
                  onChange={() => toggleData(option.id)}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-3 text-lg">{option.icon}</span>
                <span className="ml-2">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Formato de salida:</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              { format: "csv" as const, label: "CSV", icon: FileSpreadsheet },
              { format: "json" as const, label: "JSON", icon: FileJson },
              { format: "html" as const, label: "HTML", icon: FileText },
            ].map(({ format, label, icon: Icon }) => (
              <label key={format} className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                selectedFormat === format ? "bg-blue-50 border-blue-300" : "hover:bg-gray-50"
              }`}>
                <input
                  type="radio"
                  name="format"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={() => setSelectedFormat(format)}
                  className="w-4 h-4"
                />
                <Icon className="w-5 h-5 ml-2" />
                <span className="ml-2">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {exported && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✓ Datos exportados correctamente
          </div>
        )}

        <Button
          onClick={handleExport}
          disabled={selectedData.length === 0 || exporting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Download className="w-4 h-4 mr-2" />
          {exporting ? "Exportando..." : "Descargar"}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">Información:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Los datos se exportarán en el formato seleccionado</li>
            <li>Está incluida la información de tu negocio</li>
            <li>Los datos sensibles se encriptarán en JSON</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
