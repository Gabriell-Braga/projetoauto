"use client";

import { ApiError } from "@/lib/http";
import { parseBrl } from "@/lib/integrations/fipe";

/**
 * Consulta à tabela FIPE feita pelo NAVEGADOR, não pelo servidor.
 *
 * A API limita 500 consultas por dia por IP. Chamando do servidor, todas as
 * revendas dividiriam o IP de saída do Cloudflare Workers — que é compartilhado
 * com o mundo inteiro e já vinha estourado: a resposta era 429 em 135ms, sem
 * nenhuma consulta nossa ter acontecido.
 *
 * Do navegador, cada revenda usa o próprio IP e a própria cota. Uma loja
 * cadastrando carros o dia inteiro não chega perto de 500.
 *
 * A API permite: `access-control-allow-origin: *` e preflight liberando GET.
 * Nada sai daqui além do que já é público — é tabela de preço, sem dado de
 * cliente.
 */
const BASE = "https://parallelum.com.br/fipe/api/v1/carros";

const CATALOG_TTL = 7 * 24 * 60 * 60 * 1000;
const PRICE_TTL = 24 * 60 * 60 * 1000;

type Cached<T> = { at: number; ttl: number; value: T };

/**
 * Cache no próprio navegador.
 *
 * Marca e modelo mudam uma vez por ano, então guardar por uma semana derruba
 * o consumo a quase nada: quem cadastra dez carros no dia faz uma consulta de
 * marcas, não dez.
 *
 * Todo acesso é protegido: navegação anônima, armazenamento cheio ou bloqueado
 * fazem o localStorage lançar, e isso não pode derrubar o cadastro.
 */
function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const entry = JSON.parse(raw) as Cached<T>;
    if (Date.now() - entry.at > entry.ttl) {
      window.localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T, ttl: number): void {
  try {
    const entry: Cached<T> = { at: Date.now(), ttl, value };
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // sem espaço ou sem permissão: seguir sem cache é melhor do que falhar
  }
}

async function get<T>(path: string, cacheKey: string, ttl: number): Promise<T> {
  const cached = readCache<T>(cacheKey);
  if (cached !== null) return cached;

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(502, 'Não consegui falar com a tabela FIPE. Escolha "Outro" e digite.');
  }

  if (response.status === 429) {
    throw new ApiError(
      429,
      'Esta rede atingiu o limite diário de consultas à FIPE. Escolha "Outro" e digite; amanhã volta ao normal.',
    );
  }
  if (!response.ok) {
    throw new ApiError(502, `A tabela FIPE não respondeu (${response.status}).`);
  }

  const payload = (await response.json()) as T & { error?: string };
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    throw new ApiError(404, "Combinação não encontrada na tabela FIPE.");
  }

  writeCache(cacheKey, payload, ttl);
  return payload;
}

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

export function fetchBrands(): Promise<FipeBrand[]> {
  return get<FipeBrand[]>("/marcas", "fipe:brands", CATALOG_TTL);
}

export async function fetchModels(brandCode: string): Promise<FipeModel[]> {
  const payload = await get<{ modelos: FipeModel[] }>(
    `/marcas/${brandCode}/modelos`,
    `fipe:models:${brandCode}`,
    CATALOG_TTL,
  );
  return payload.modelos ?? [];
}

export function fetchYears(brandCode: string, modelCode: string): Promise<FipeYear[]> {
  return get<FipeYear[]>(
    `/marcas/${brandCode}/modelos/${modelCode}/anos`,
    `fipe:years:${brandCode}:${modelCode}`,
    CATALOG_TTL,
  );
}

export async function fetchQuote(
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipeQuote> {
  const payload = await get<{
    Marca: string;
    Modelo: string;
    AnoModelo: number;
    Combustivel: string;
    CodigoFipe: string;
    MesReferencia: string;
    Valor: string;
  }>(
    `/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
    `fipe:quote:${brandCode}:${modelCode}:${yearCode}`,
    PRICE_TTL,
  );

  return {
    marca: payload.Marca,
    modelo: payload.Modelo,
    anoModelo: payload.AnoModelo,
    combustivel: payload.Combustivel,
    codigoFipe: payload.CodigoFipe,
    mesReferencia: payload.MesReferencia.trim(),
    valorCents: parseBrl(payload.Valor),
  };
}
