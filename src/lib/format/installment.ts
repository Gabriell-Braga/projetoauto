/**
 * Estimativa de parcela para a simulação do site.
 *
 * O desenho pede este número — "A partir de R$ 3.120/mês*" — junto de uma
 * ressalva. Ele existe porque quem procura carro compara parcela, não saldo
 * financiado: sem ele a simulação não responde a pergunta que a pessoa veio
 * fazer.
 *
 * A ressalva é parte do número, não enfeite. A taxa real sai da análise de
 * crédito daquela pessoa, e a loja não a controla — por isso "a partir de", o
 * asterisco e a frase que acompanha ficam juntos do valor em toda tela onde
 * ele aparece.
 */

/**
 * Taxa mensal padrão.
 *
 * Sai dos próprios números do desenho: financiar R$ 109.990 em 48 meses dá
 * "a partir de R$ 3.120/mês", o que implica cerca de 1,35% ao mês. Não é um
 * chute nosso — é a premissa que quem desenhou usou, e a revenda pode trocar.
 */
export const DEFAULT_MONTHLY_RATE = 1.35;

/**
 * Tabela Price: parcela fixa de um valor financiado.
 *
 * `PMT = PV × i / (1 − (1+i)^−n)`
 *
 * Taxa zero cai na divisão simples, senão a fórmula divide por zero e devolve
 * `NaN` — que na tela vira "R$ NaN" em vez de um erro visível.
 */
export function monthlyInstallmentCents(
  financedCents: number,
  months: number,
  monthlyRatePercent: number,
): number | null {
  if (financedCents <= 0 || months <= 0) return null;

  const rate = monthlyRatePercent / 100;
  if (rate <= 0) return Math.round(financedCents / months);

  const factor = 1 - Math.pow(1 + rate, -months);
  if (factor <= 0) return null;

  return Math.round((financedCents * rate) / factor);
}

/** O total pago ao fim, para quem quiser conferir o custo do crédito. */
export function totalPaidCents(installmentCents: number, months: number): number {
  return installmentCents * months;
}
