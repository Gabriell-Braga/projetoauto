import { cached } from "@/lib/cache";
import { ApiError } from "@/lib/http";

/**
 * Tabela FIPE.
 *
 * Fonte pública e gratuita, sem contrato nem credencial — é o que permite
 * entregar preenchimento assistido e preço de referência sem depender de
 * fornecedor. Não substitui consulta por placa: aqui se escolhe o modelo, ali
 * se descobre qual é o carro.
 */
const BASE = "https://parallelum.com.br/fipe/api/v1/carros";

/**
 * Cache muito longo, de propósito.
 *
 * A API devolve `x-ratelimit-limit: 500` por dia, e esse teto é da plataforma
 * inteira — não de cada revenda. Sem cache, um punhado de cadastros consome a
 * cota do dia e a lista fica vazia para todo mundo até a meia-noite.
 *
 * Marcas e modelos mudam uma vez por ano; a tabela de preços, uma vez por mês.
 * O TTL longo também é a nossa proteção contra a API cair: enquanto a cópia
 * estiver no cache, a queda dela é invisível aqui dentro.
 */
const CATALOG_TTL = 30 * 24 * 60 * 60;
const PRICE_TTL = 7 * 24 * 60 * 60;

export type FipeBrand = { codigo: string; nome: string };
export type FipeModel = { codigo: number; nome: string };
export type FipeYear = { codigo: string; nome: string };

export type FipeQuote = {
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  valorCents: number;
};

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { accept: "application/json", "user-agent": "ProjetoAuto" },
      // curto: o formulário não pode ficar preso esperando serviço de fora
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new ApiError(
      502,
      'Não consegui falar com a tabela FIPE. Escolha "Outro" e digite.',
    );
  }

  if (!response.ok) {
    // 429 é o caso comum e tem conserto diferente de "fora do ar": quem lê
    // precisa saber que é cota, não defeito
    if (response.status === 429) {
      throw new ApiError(
        429,
        "A tabela FIPE atingiu o limite de consultas do dia. Escolha \"Outro\" e digite; amanhã volta ao normal.",
      );
    }
    throw new ApiError(
      502,
      `A tabela FIPE não respondeu (${response.status}). Escolha "Outro" e digite.`,
    );
  }

  const payload = (await response.json()) as T & { error?: string };
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new ApiError(404, "Combinação não encontrada na tabela FIPE.");
  }
  return payload;
}

export function listBrands(): Promise<FipeBrand[]> {
  return cached("fipe:brands", CATALOG_TTL, () => request<FipeBrand[]>("/marcas"));
}

export function listModels(brandCode: string): Promise<FipeModel[]> {
  return cached(`fipe:models:${brandCode}`, CATALOG_TTL, async () => {
    const payload = await request<{ modelos: FipeModel[] }>(`/marcas/${brandCode}/modelos`);
    return payload.modelos ?? [];
  });
}

export function listYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
  return cached(`fipe:years:${brandCode}:${modelCode}`, CATALOG_TTL, () =>
    request<FipeYear[]>(`/marcas/${brandCode}/modelos/${modelCode}/anos`),
  );
}

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

export function getQuote(
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipeQuote> {
  return cached(`fipe:quote:${brandCode}:${modelCode}:${yearCode}`, PRICE_TTL, async () => {
    const payload = await request<{
      Marca: string;
      Modelo: string;
      AnoModelo: number;
      Combustivel: string;
      CodigoFipe: string;
      MesReferencia: string;
      Valor: string;
    }>(`/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`);

    return {
      marca: payload.Marca,
      modelo: payload.Modelo,
      anoModelo: payload.AnoModelo,
      combustivel: payload.Combustivel,
      codigoFipe: payload.CodigoFipe,
      mesReferencia: payload.MesReferencia.trim(),
      valorCents: parseBrl(payload.Valor),
    };
  });
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
