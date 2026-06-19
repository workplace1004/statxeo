import "server-only";

import {createHmac, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

// Use the existing AUTH_SESSION_SECRET for encryption (should be 32 bytes)
function getEncryptionKey(): Buffer {
  const secret = getAuthSecret();
  // If the secret is exactly 64 hex chars, it's 32 bytes
  if (secret.length === 64) {
    return Buffer.from(secret, "hex");
  }
  // Otherwise, hash it to ensure it's exactly 32 bytes for AES-256
  return createHmac("sha256", secret).update(secret).digest();
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET must be set");
  }
  return secret;
}

function signPayload(encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(encoded).digest("base64url");
}

export function sealJson<T extends object>(payload: T, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signPayload(encoded, secret)}`;
}

export function unsealJson<T>(token: string, secret: string): T | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded, secret);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;

  try {
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/**
 * Encrypts a string (e.g., OAuth Token) using AES-256-GCM for storage at rest.
 * Returns a colon-separated string: "iv:authTag:encryptedData" (all hex).
 */
export function encryptToken(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = randomBytes(12); // 12 bytes is standard for GCM
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a colon-separated string: "iv:authTag:encryptedData".
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return encryptedText;
  
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format. Expected iv:authTag:encryptedData");
  }
  
  const [ivHex, authTagHex, encryptedHex] = parts;
  
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
