import { z } from "zod";

/**
 * Política de senha da plataforma.
 *
 * Módulo puro (só zod), usado nos dois lados: o formulário mostra a lista ao
 * vivo enquanto a pessoa digita, e a API valida de novo antes de gravar.
 * Cliente é conveniência; servidor é a regra.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `Pelo menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lower",
    label: "Uma letra minúscula",
    test: (value) => /[a-zà-ÿ]/.test(value),
  },
  {
    id: "upper",
    label: "Uma letra maiúscula",
    test: (value) => /[A-ZÀ-Ý]/.test(value),
  },
  {
    id: "digit",
    label: "Um número",
    test: (value) => /\d/.test(value),
  },
];

/** Senhas que aparecem em qualquer lista de vazamento — não adianta o resto. */
const OBVIOUS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "senha123",
  "senha1234",
  "password",
  "password1",
  "qwerty123",
  "abc12345",
  "admin123",
  "mudar123",
  "trocar123",
]);

export function isObviousPassword(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (OBVIOUS.has(normalized)) return true;
  // sequência única repetida, tipo "aaaaaaaa"
  return /^(.)\1+$/.test(normalized);
}

export type PasswordCheck = { id: string; label: string; ok: boolean };

/** Estado de cada regra — alimenta a lista ao vivo do formulário. */
export function checkPassword(value: string): PasswordCheck[] {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    ok: rule.test(value),
  }));
}

export function isPasswordStrong(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value)) && !isObviousPassword(value);
}

/** Primeiro problema encontrado, em português, para mensagem de erro. */
export function firstPasswordIssue(value: string): string | null {
  const failing = PASSWORD_RULES.find((rule) => !rule.test(value));
  if (failing) return `A senha precisa ter: ${failing.label.toLowerCase()}.`;
  if (isObviousPassword(value)) return "Escolha uma senha menos óbvia.";
  return null;
}

/** Schema reaproveitado em todo lugar onde uma senha é definida. */
export const strongPasswordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, "Senha muito longa")
  .superRefine((value, ctx) => {
    for (const rule of PASSWORD_RULES) {
      if (!rule.test(value)) {
        ctx.addIssue({ code: "custom", message: `A senha precisa ter: ${rule.label.toLowerCase()}` });
      }
    }
    if (isObviousPassword(value)) {
      ctx.addIssue({ code: "custom", message: "Escolha uma senha menos óbvia" });
    }
  });

/**
 * Senha provisória que sempre passa na política — senão o admin gera um valor
 * que a própria plataforma recusaria na hora da troca.
 */
export function generateCompliantPassword(length = 14): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const all = lower + upper + digits;

  const size = Math.max(length, PASSWORD_MIN_LENGTH);
  const bytes = crypto.getRandomValues(new Uint8Array(size));

  const chars = [
    lower[bytes[0] % lower.length],
    upper[bytes[1] % upper.length],
    digits[bytes[2] % digits.length],
    ...Array.from(bytes.slice(3), (byte) => all[byte % all.length]),
  ];

  // embaralha para os obrigatórios não ficarem sempre nas mesmas posições
  const shuffle = crypto.getRandomValues(new Uint32Array(chars.length));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
