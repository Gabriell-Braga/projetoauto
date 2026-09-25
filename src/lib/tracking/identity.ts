import { onlyDigits } from "@/lib/utils";

/**
 * Dado pessoal que sai daqui sai com hash, e normalizado antes.
 *
 * A Meta exige SHA-256 de valores normalizados: e-mail em minúsculas e sem
 * espaço, telefone só com dígitos e com o código do país. Mandar "  Ana@X.com "
 * cru não é só erro de forma — o hash não bate com o que eles têm, a pessoa
 * não é reconhecida, e a campanha fica sem a conversão que de fato aconteceu.
 *
 * Normalizar também é o que evita mandar o dado em claro por engano: as
 * funções que os conectores usam só devolvem hash.
 */

export function normalizeEmail(value: string | null | undefined): string | null {
  const email = value?.trim().toLowerCase();
  return email && email.includes("@") ? email : null;
}

/**
 * Telefone no formato que a Meta espera: só dígitos, com o país na frente.
 *
 * Os números brasileiros chegam aqui sem o 55 (é assim que a revenda digita
 * e é assim que o site captura). Somar o 55 aqui, num lugar só, é o que faz
 * o telefone casar — e é o erro mais comum de quem integra CAPI no Brasil.
 */
export function normalizePhone(value: string | null | undefined): string | null {
  const digits = onlyDigits(value ?? "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

/** Primeiro e último nome, separados, como a Meta pede (fn e ln). */
export function splitName(value: string | null | undefined): {
  first: string | null;
  last: string | null;
} {
  const parts = (value ?? "")
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return { first: null, last: null };
  if (parts.length === 1) return { first: parts[0], last: null };
  return { first: parts[0], last: parts[parts.length - 1] };
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value) as unknown as ArrayBuffer,
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Hash de um valor já normalizado; nulo entra e nulo sai. */
export async function hashed(value: string | null): Promise<string | null> {
  return value ? sha256(value) : null;
}
