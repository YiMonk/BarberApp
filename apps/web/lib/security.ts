// Security utilities

import crypto from "crypto";

/**
 * Rate Limiting
 */
const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutos
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetTime) {
    rateLimits.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * CSRF Protection
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateCSRFToken(token: string, expected: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Content Security Policy Headers
 */
export function getCSPHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  };
}

/**
 * Security Headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "geolocation=(), microphone=(), camera=(), payment=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };
}

/**
 * Input Sanitization
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, ""); // Remove event handlers
}

/**
 * Email Validation (Advanced)
 */
export function validateEmail(email: string): boolean {
  const regex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) && email.length <= 254;
}

/**
 * Password Strength Check
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push("Al menos 8 caracteres");

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  else feedback.push("Mezcla de mayúsculas y minúsculas");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Al menos un número");

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push("Al menos un carácter especial");

  return { score, feedback };
}

/**
 * Token Generation (Secure)
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash Password (Server-side only)
 */
export async function hashPassword(password: string): Promise<string> {
  // En producción, usar bcrypt o argon2
  // const bcrypt = require('bcrypt');
  // return bcrypt.hash(password, 10);
  return password; // Placeholder
}

/**
 * Encryption Utility
 */
export function encryptSensitiveData(
  data: string,
  key: string
): { iv: string; encryptedData: string } {
  const algorithm = "aes-256-cbc";
  const keyBuffer = crypto.scryptSync(key, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted,
  };
}

export function decryptSensitiveData(
  encrypted: { iv: string; encryptedData: string },
  key: string
): string {
  const algorithm = "aes-256-cbc";
  const keyBuffer = crypto.scryptSync(key, "salt", 32);
  const iv = Buffer.from(encrypted.iv, "hex");
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);

  let decrypted = decipher.update(encrypted.encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * IP Whitelist Check
 */
export function isIPWhitelisted(
  clientIP: string,
  whitelist: string[]
): boolean {
  return whitelist.includes(clientIP);
}
