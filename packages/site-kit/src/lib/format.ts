import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Formatacao que os templates usam.
 *
 * O painel tem mais formatadores (data, telefone, CNPJ) e continua dono deles;
 * so o que o site publico desenha veio para ca, para nao existirem duas
 * implementacoes de moeda dando resultados diferentes na mesma tela.
 */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}
