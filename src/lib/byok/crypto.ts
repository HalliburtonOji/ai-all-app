import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

/**
 * AES-256-GCM encrypt-at-rest helpers for BYOK.
 *
 * Key derivation: scrypt(SUPABASE_SERVICE_ROLE_KEY, "ai-all-app:byok:v1", 32).
 * The service-role key is server-only and never reaches the browser, so it's
 * a reasonable basis for an app-side encryption key without a separate
 * `ENCRYPTION_KEY` secret. The derivation is deterministic so the same
 * runtime can encrypt + decrypt without storing the key elsewhere.
 *
 * Caveat: if the service-role key is ever rotated, all stored ciphertexts
 * become unreadable. The user-facing recovery is "re-paste your API key in
 * /me/keys". Acceptable for this scale.
 */

const ALGORITHM = "aes-256-gcm" as const;
const KEY_LENGTH = 32;
const IV_LENGTH = 12; // GCM standard
const KDF_SALT = "ai-all-app:byok:v1";

let cachedKey: Buffer | null = null;

function deriveKey(): Buffer {
  if (cachedKey) return cachedKey;
  const seed = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!seed) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set; BYOK encryption requires it.",
    );
  }
  cachedKey = scryptSync(seed, KDF_SALT, KEY_LENGTH);
  return cachedKey;
}

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export function encryptString(plaintext: string): EncryptedField {
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const buf = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: buf.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptString(field: EncryptedField): string {
  const key = deriveKey();
  const iv = Buffer.from(field.iv, "base64");
  const authTag = Buffer.from(field.authTag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const buf = Buffer.concat([
    decipher.update(Buffer.from(field.ciphertext, "base64")),
    decipher.final(),
  ]);
  return buf.toString("utf8");
}

/**
 * One-line redaction for displaying in the UI. Shows only the last 4
 * characters so a user can recognise their key without leaking it.
 *   redactKey("sk-ant-abcd1234efgh5678") -> "sk-ant-…5678"
 *   redactKey("short")                    -> "…hort"
 */
export function redactKey(plaintext: string): string {
  if (plaintext.length <= 4) return `…${plaintext}`;
  const tail = plaintext.slice(-4);
  // Keep a hint of the prefix when it looks like a typed prefix
  // (sk-ant, sk-, r8_, etc.) so users see "yes that's the right key".
  const prefixMatch = plaintext.match(/^([a-z]{2,5}[-_])/i);
  const prefix = prefixMatch ? prefixMatch[1] : "";
  return `${prefix}…${tail}`;
}
