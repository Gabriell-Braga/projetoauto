/**
 * Datas de cobrança no fuso de Brasília.
 *
 * O runtime roda em UTC e o Asaas trabalha no horário de Brasília. Entre 21h e
 * meia-noite os dois discordam sobre que dia é hoje, e nesse intervalo:
 *
 *  - a baixa de pagamento era recusada, porque mandávamos amanhã como data de
 *    recebimento e o gateway responde que não aceita data futura;
 *  - o primeiro vencimento pulava um mês inteiro, porque "o dia já passou
 *    neste mês" comparava contra o dia seguinte.
 *
 * Toda conta de data que conversa com o gateway passa por aqui.
 */

export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRAZIL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type DateParts = { year: number; month: number; day: number };

/** Ano, mês (1-12) e dia como estão no relógio de Brasília. */
export function brazilDateParts(date: Date): DateParts {
  // formatToParts em vez de format: não depende de como o locale ordena
  const parts = formatter.formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

/** "2026-08-31" — o formato de data que o Asaas espera. */
export function brazilIsoDate(date: Date): string {
  const { year, month, day } = brazilDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Instante que representa uma data de cobrança.
 *
 * Meio-dia UTC é 9h em Brasília: longe das duas viradas, então a data é a mesma
 * nos dois fusos e nenhum horário de verão a empurra para o dia vizinho.
 */
export function billingDate({ year, month, day }: DateParts): Date {
  return new Date(Date.UTC(year, month - 1, day, 12));
}
