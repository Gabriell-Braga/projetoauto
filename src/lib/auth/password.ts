/**
 * Hash de senha com PBKDF2 via Web Crypto — compatível com Cloudflare Workers.
 * (bcrypt/argon2 nativos do Node não rodam no runtime do Webflow Cloud.)
 */

const ITERATIONS = 100_000;
const KEY_LENGTH_BITS = 256;
const SALT_BYTES = 16;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      salt: salt as any,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,
    KEY_LENGTH_BITS,
  );
  return new Uint8Array(bits);
}

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

export async function hashPassword(
  password: string,
  salt = generateSalt(),
): Promise<{ hash: string; salt: string }> {
  const hash = toBase64(await derive(password, fromBase64(salt)));
  return { hash, salt };
}

/** Comparação em tempo constante para evitar timing attacks. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(
  password: string,
  hash: string,
  salt: string,
): Promise<boolean> {
  try {
    const computed = toBase64(await derive(password, fromBase64(salt)));
    return timingSafeEqual(computed, hash);
  } catch {
    return false;
  }
}

/**
 * Senha provisória legível para entregar a alguém.
 * Delega ao gerador da política: o anterior sorteava do alfabeto inteiro e
 * podia devolver uma senha que a própria plataforma recusaria (sem número,
 * por exemplo).
 */
export { generateCompliantPassword as generateTemporaryPassword } from "./password-policy";
