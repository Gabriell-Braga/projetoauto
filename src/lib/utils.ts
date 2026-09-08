/*
 * `cn`, moeda e numero vem do pacote compartilhado: os templates usam os tres,
 * e duas implementacoes de moeda acabariam mostrando precos diferentes na
 * mesma tela. O resto daqui e so do painel e fica.
 */
export { cn, formatCurrency, formatNumber } from "@projetoauto/site-kit/format";

export function formatDate(value: Date | number | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(value));
}

export function formatDateTime(value: Date | number | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Slug seguro para URLs (remove acentos e caracteres especiais). */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Somente dígitos — usado em telefone/WhatsApp/CNPJ. */
export function onlyDigits(value: string): string {
  return value.replace(/\D+/g, "");
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "—";
  const digits = onlyDigits(value);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value;
}
