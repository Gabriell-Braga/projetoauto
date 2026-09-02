/**
 * Formatação de campos numéricos enquanto se digita, no padrão brasileiro:
 * ponto separando milhar, vírgula separando centavos.
 *
 * O objetivo é ler "79.900,00" e não "7990000". Sem separador, um erro de um
 * dígito no preço de um carro passa despercebido — a diferença entre 7.990 e
 * 79.900 é uma coluna de pixels.
 *
 * Formatar enquanto se digita tem uma armadilha: não pode brigar com quem
 * está no meio da digitação. Por isso a vírgula recém-digitada sobrevive, e
 * os zeros à direita dos centavos também.
 */

/** Só os dígitos, na ordem em que apareceram. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Agrupa de três em três, da direita para a esquerda. */
export function groupThousands(digits: string): string {
  const clean = digits.replace(/^0+(?=\d)/, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/* ------------------------------------------------------------------------ */
/* Inteiros — quilometragem, quantidades                                     */
/* ------------------------------------------------------------------------ */

export function formatIntegerInput(raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return "";
  return groupThousands(digits);
}

export function parseIntegerInput(raw: string): number {
  const digits = digitsOnly(raw);
  return digits ? Number(digits) : 0;
}

/* ------------------------------------------------------------------------ */
/* Dinheiro                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * Formata mantendo a digitação viva.
 *
 * "1234" vira "1.234"; "1234," continua "1.234," porque a pessoa acabou de
 * pedir os centavos; "1234,5" vira "1.234,5" sem completar o zero — completar
 * sozinho moveria o cursor e trocaria o número debaixo do dedo.
 */
export function formatCurrencyInput(raw: string): string {
  const negative = raw.trim().startsWith("-");
  const [wholeRaw, ...rest] = raw.replace(/[^\d,]/g, "").split(",");

  const whole = groupThousands(digitsOnly(wholeRaw)) || (rest.length > 0 ? "0" : "");
  const sign = negative && whole ? "-" : "";

  if (rest.length === 0) return sign + whole;

  // só a primeira vírgula conta; o resto vira dígito de centavo
  const cents = digitsOnly(rest.join("")).slice(0, 2);
  return `${sign}${whole},${cents}`;
}

/**
 * Lê o valor em centavos.
 *
 * O ponto é milhar e a vírgula é decimal — o inverso do que `Number()` espera.
 * Passar "79.900,00" direto para `Number` daria 79,9 em vez de 79.900.
 */
export function parseCurrencyToCents(raw: string): number {
  const negative = raw.trim().startsWith("-");
  const [whole, decimals = ""] = raw.replace(/[^\d,]/g, "").split(",");

  const wholeDigits = digitsOnly(whole) || "0";
  // "5" em centavos é 50, não 5: uma casa decimal são décimos
  const centDigits = digitsOnly(decimals).slice(0, 2).padEnd(2, "0");

  const total = Number(wholeDigits) * 100 + Number(centDigits);
  return negative ? -total : total;
}

/** Centavos para o formato do campo, com as duas casas sempre visíveis. */
export function centsToCurrencyInput(cents: number): string {
  const negative = cents < 0;
  const absolute = Math.abs(Math.round(cents));
  const whole = groupThousands(String(Math.floor(absolute / 100)));
  const decimals = String(absolute % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${whole || "0"},${decimals}`;
}
