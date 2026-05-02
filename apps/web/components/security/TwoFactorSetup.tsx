"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Copy, RotateCw } from "lucide-react";

interface TwoFactorSetupProps {
  userId: string;
}

export function TwoFactorSetup({ userId }: TwoFactorSetupProps) {
  const [enabled, setEnabled] = useState(false);
  const [step, setStep] = useState<"disabled" | "setup" | "verify">("disabled");
  const [secret, setSecret] = useState("ABCD-1234-EFGH-5678");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generateSecret = () => {
    const newSecret = Math.random().toString(36).substring(2, 15).toUpperCase();
    setSecret(`${newSecret.substring(0, 4)}-${newSecret.substring(4, 8)}-${newSecret.substring(8, 12)}-${newSecret.substring(12, 16)}`);
  };

  const handleSetup = () => {
    generateSecret();
    setStep("setup");
  };

  const handleVerify = () => {
    if (verificationCode.length === 6) {
      setStep("verify");
      setBackupCodes(
        Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 10).toUpperCase()
        )
      );
    }
  };

  const handleEnable = () => {
    setEnabled(true);
    setStep("disabled");
    setVerificationCode("");
  };

  const handleDisable = () => {
    setEnabled(false);
    setStep("disabled");
    setSecret("");
    setBackupCodes([]);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Autenticación de Dos Factores
      </h2>

      {step === "disabled" && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${
            enabled ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
          }`}>
            <p className="font-semibold mb-2">
              Estado: {enabled ? "✓ Habilitado" : "Deshabilitado"}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              {enabled
                ? "Tu cuenta está protegida con autenticación de dos factores."
                : "Habilita la autenticación de dos factores para mayor seguridad."}
            </p>
            {!enabled ? (
              <Button onClick={handleSetup} className="bg-blue-600 hover:bg-blue-700">
                Configurar 2FA
              </Button>
            ) : (
              <Button onClick={handleDisable} className="bg-red-600 hover:bg-red-700">
                Deshabilitar 2FA
              </Button>
            )}
          </div>
        </div>
      )}

      {step === "setup" && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-3">
              1. Descarga una aplicación de autenticación como Google Authenticator, Microsoft Authenticator o Authy.
            </p>
            <p className="text-sm text-gray-600 mb-3">
              2. Escanea este código QR o ingresa la clave manualmente:
            </p>

            <div className="bg-white p-4 rounded border mb-4 flex justify-center">
              <div className="w-40 h-40 bg-gray-200 rounded flex items-center justify-center">
                [QR Code Placeholder]
              </div>
            </div>

            <p className="text-sm font-semibold mb-2">O ingresa esta clave:</p>
            <div className="flex items-center gap-2 mb-4">
              <code className="flex-1 bg-gray-100 p-3 rounded font-mono text-sm">{secret}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(secret);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Ingresa el código de 6 dígitos:
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full px-3 py-2 border rounded-lg text-2xl text-center tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={verificationCode.length !== 6}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Verificar
            </Button>
            <Button
              onClick={() => setStep("disabled")}
              className="flex-1 bg-gray-400 hover:bg-gray-500"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === "verify" && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-700 mb-2">✓ Verificación exitosa</p>
            <p className="text-sm text-gray-600">
              Tu autenticación de dos factores ha sido configurada correctamente.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">
              Códigos de respaldo (guarda estos en un lugar seguro):
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, idx) => (
                  <code
                    key={idx}
                    className="bg-white p-2 rounded text-sm border font-mono cursor-pointer hover:bg-blue-50"
                    onClick={() => handleCopyCode(code)}
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>

            {copied && (
              <p className="text-sm text-green-600 mb-4">✓ Código copiado</p>
            )}
          </div>

          <Button
            onClick={handleEnable}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Completar Configuración
          </Button>
        </div>
      )}
    </div>
  );
}
