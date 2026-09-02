/**
 * Regras da tabela FIPE.
 *
 * Só o que é puro: leitura de valor, comparação com o preço pedido e a
 * separação de modelo e versão. A CONSULTA em si mora no navegador, em
 * lib/client/fipe-client.ts — a API limita por IP, e o IP de saída do
 * Cloudflare Workers é compartilhado e já vinha estourado.
 */

/**
 * "R$ 48.328,00" vira 4832800.
 *
 * A API devolve o valor já formatado em português, então o ponto é separador
 * de milhar e a vírgula é decimal — inverter isso daria um preço mil vezes
 * menor sem nenhum erro visível.
 */
export function parseBrl(value: string): number {
  const digits = value.replace(/[^\d,]/g, "").replace(",", ".");
  return Math.round((Number(digits) || 0) * 100);
}

/* ------------------------------------------------------------------------ */
/* Avaliação                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Quanto o preço pedido foge da referência, em pontos percentuais.
 *
 * Positivo é acima da FIPE. Devolve null sem referência, em vez de zero: zero
 * significaria "está na tabela", o que é uma afirmação que não podemos fazer.
 */
export function priceGapPercent(
  askingCents: number,
  referenceCents: number | null | undefined,
): number | null {
  if (!referenceCents || referenceCents <= 0 || askingCents <= 0) return null;
  return Math.round(((askingCents - referenceCents) / referenceCents) * 1000) / 10;
}

export type PriceVerdict = "abaixo" | "na_faixa" | "acima";

/**
 * Faixa de tolerância de 5%.
 *
 * A FIPE é referência, não preço praticado: quilometragem, estado e região
 * movem o valor legitimamente. Marcar como "fora" qualquer diferença faria o
 * aviso aparecer em todo anúncio e ninguém mais olharia para ele.
 */
export function priceVerdict(gapPercent: number | null): PriceVerdict | null {
  if (gapPercent === null) return null;
  if (gapPercent > 5) return "acima";
  if (gapPercent < -5) return "abaixo";
  return "na_faixa";
}

/* ------------------------------------------------------------------------ */
/* Modelo e versão                                                           */
/* ------------------------------------------------------------------------ */

/**
 * A FIPE junta modelo e versão numa string só.
 *
 * "ONIX HATCH LT 1.0 12V Flex 5p Mec." é o modelo ONIX na versão "HATCH LT
 * 1.0...". Separamos na primeira palavra porque o filtro do site precisa de
 * "Onix", não de trinta strings diferentes que começam com Onix — cada versão
 * viraria um modelo distinto na lista de filtros.
 *
 * A separação nunca perde informação: modelo + versão reconstrói exatamente o
 * nome original. Nome de modelo com duas palavras ("Grand Siena") fica com a
 * segunda na versão, o que agrupa um pouco mais do que o ideal, mas o título
 * do anúncio continua correto porque é a concatenação.
 */
export function splitFipeModel(fullName: string): { model: string; version: string } {
  const trimmed = fullName.trim().replace(/\s+/g, " ");
  const space = trimmed.indexOf(" ");
  if (space === -1) return { model: trimmed, version: "" };
  return { model: trimmed.slice(0, space), version: trimmed.slice(space + 1) };
}

/** Junta de volta, para casar com o nome que a FIPE conhece. */
export function joinFipeModel(model: string, version: string): string {
  return [model.trim(), version.trim()].filter(Boolean).join(" ");
}
