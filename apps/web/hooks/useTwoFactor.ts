import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface TwoFactorSettings {
  id: string;
  user_id: string;
  method: "totp" | "sms" | "email";
  enabled: boolean;
  phone?: string;
  backup_codes?: string[];
  created_at: string;
  verified_at?: string;
}

export function useTwoFactor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);

  const enableTOTP = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // En producción, usar una librería como 'speakeasy' o 'otpauth'
      const secret = generateSecret();
      const qrCode = await generateQRCode(secret);

      return {
        success: true,
        secret,
        qrCode,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error enabling TOTP";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyTOTP = useCallback(async (secret: string, code: string) => {
    setLoading(true);
    setError(null);

    try {
      const isValid = verifyTOTPCode(secret, code);

      if (!isValid) {
        throw new Error("Invalid code");
      }

      const { data: userData } = await supabase.auth.getUser();

      const backupCodes = generateBackupCodes();

      const { data, error: err } = await supabase
        .from("two_factor_settings")
        .upsert({
          user_id: userData?.user?.id,
          method: "totp",
          enabled: true,
          backup_codes: backupCodes,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (err) throw err;

      setSettings(data as TwoFactorSettings);
      return { success: true, backupCodes };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error verifying TOTP";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const disableTwoFactor = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error: err } = await supabase
        .from("two_factor_settings")
        .update({ enabled: false })
        .eq("user_id", userData?.user?.id);

      if (err) throw err;

      setSettings(null);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error disabling 2FA";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyBackupCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!settings?.backup_codes) return false;

      return settings.backup_codes.includes(code);
    },
    [settings]
  );

  return {
    settings,
    loading,
    error,
    enableTOTP,
    verifyTOTP,
    disableTwoFactor,
    verifyBackupCode,
  };
}

function generateSecret(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

async function generateQRCode(secret: string): Promise<string> {
  // En producción, usar 'qrcode' library
  // const QRCode = require('qrcode');
  // return QRCode.toDataURL(`otpauth://totp/Barberos%20SaaS?secret=${secret}`);
  return `data:image/png;base64,placeholder`;
}

function verifyTOTPCode(secret: string, code: string): boolean {
  // En producción, usar 'speakeasy' library
  // const speakeasy = require('speakeasy');
  // return speakeasy.totp.verify({
  //   secret: secret,
  //   encoding: 'base32',
  //   token: code,
  //   window: 2
  // });
  return code.length === 6 && /^\d+$/.test(code);
}

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += Math.floor(Math.random() * 10);
    }
    codes.push(code.replace(/(\d{4})/, "$1-"));
  }
  return codes;
}
