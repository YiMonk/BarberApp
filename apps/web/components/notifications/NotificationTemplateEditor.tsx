"use client";

import { useNotificationTemplates } from "@/hooks/useNotificationTemplates";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Save } from "lucide-react";

interface NotificationTemplateEditorProps {
  providerId: string;
}

export function NotificationTemplateEditor({ providerId }: NotificationTemplateEditorProps) {
  const { saveTemplate, loading } = useNotificationTemplates(providerId);
  const [templateType, setTemplateType] = useState<"email" | "sms">("email");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAddVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  const handleSaveTemplate = async () => {
    if (!name.trim() || !content.trim()) return;

    const result = await saveTemplate({
      provider_id: providerId,
      type: templateType,
      name,
      subject: templateType === "email" ? subject : "",
      content,
      variables,
      enabled: true,
    });

    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setName("");
      setSubject("");
      setContent("");
      setVariables([]);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        {templateType === "email" ? (
          <Mail className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
        Editor de Plantillas
      </h2>

      <div className="mb-6 flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="email"
            checked={templateType === "email"}
            onChange={(e) => setTemplateType(e.target.value as "email" | "sms")}
            className="w-4 h-4"
          />
          <Mail className="w-5 h-5" />
          <span>Email</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="sms"
            checked={templateType === "sms"}
            onChange={(e) => setTemplateType(e.target.value as "email" | "sms")}
            className="w-4 h-4"
          />
          <MessageSquare className="w-5 h-5" />
          <span>SMS</span>
        </label>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Nombre de la Plantilla</label>
          <input
            type="text"
            placeholder="ej. Confirmación de Cita"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        {templateType === "email" && (
          <div>
            <label className="block text-sm font-semibold mb-2">Asunto</label>
            <input
              type="text"
              placeholder="ej. Tu cita está confirmada"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2">Contenido</label>
          <textarea
            placeholder="Escribe tu mensaje aquí. Usa {{variable}} para insertar variables."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg h-32"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Variables</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="ej. client_name"
              value={newVariable}
              onChange={(e) => setNewVariable(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <Button onClick={handleAddVariable} className="bg-gray-200 hover:bg-gray-300 text-gray-900">
              Añadir
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <div key={variable} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2">
                {`{{${variable}}}`}
                <button
                  onClick={() => handleRemoveVariable(variable)}
                  className="hover:text-blue-900 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Plantilla guardada correctamente
        </div>
      )}

      <Button
        onClick={handleSaveTemplate}
        disabled={loading || !name.trim() || !content.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Save className="w-4 h-4 mr-2" />
        Guardar Plantilla
      </Button>
    </div>
  );
}
