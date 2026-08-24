/**
 * Tokens de redefinição de senha.
 * O token vai no link; o banco guarda só o SHA-256 dele. Vazamento do banco
 * não permite assumir conta nenhuma.
 */
export const RESET_TTL_MINUTES = 60;

const TOKEN_BYTES = 32;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateResetToken(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(TOKEN_BYTES)));
}

export async function hashResetToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function resetExpiresAt(now = new Date()): Date {
  return new Date(now.getTime() + RESET_TTL_MINUTES * 60 * 1000);
}
