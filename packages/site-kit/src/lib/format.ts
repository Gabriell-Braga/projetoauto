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

/**
 * Telefone brasileiro como uma pessoa le.
 *
 * O painel guarda o que a revenda digitou, e ela digita de tudo: so digitos,
 * com codigo do pais, com hifen, com espaco. O site publico mostrava esse
 * texto cru — "31973065499" ao lado de um "(31) 3555-0199" no card seguinte,
 * o que faz a pagina parecer mal montada.
 *
 * Numero com o 55 na frente perde o prefixo NA EXIBICAO: quem le e brasileiro
 * olhando o telefone de uma loja da cidade dele. O 55 continua onde importa,
 * no link do WhatsApp, que precisa dele.
 *
 * O que nao for reconhecido volta como veio — inventar formato em cima de um
 * numero estranho e pior do que mostra-lo do jeito que a revenda escreveu.
 */
export function formatPhoneBR(value: string | null | undefined): string | null {
  if (!value) return null;

  let digits = value.replace(/\D+/g, "");
  if (!digits) return null;

  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  /*
   * DDD nunca comeca com zero — vao de 11 a 99.
   *
   * Sem esta guarda, "0800 123 4567" tem onze digitos e virava
   * "(08) 00123-4567": um numero que existe, apresentado como um que nao
   * existe. Numero especial nao tem DDD, entao ele sai como a revenda escreveu.
   */
  const temDDD = digits[0] !== "0";

  if (temDDD && digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (temDDD && digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value;
}
