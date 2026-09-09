import { ApiError } from "@/lib/http";
import type { DnsRecord } from "@/db/schema";
import { dnsRecordName, type VercelDomainState } from "./domains";

/**
 * API de domínios da Vercel.
 *
 * Quem hospeda os sites das revendas é um projeto na Vercel; quem manda
 * adicionar e conferir domínio é este painel. A revenda nunca entra na Vercel
 * — ela digita o endereço aqui, recebe o registro de DNS para criar, e volta
 * para conferir.
 *
 * Só a parte de domínio mora aqui. Deploy do app dos sites é assunto do repo
 * dele, e misturar as duas coisas faria este arquivo virar cliente genérico
 * da Vercel sem que ninguém tenha pedido isso.
 */

const BASE = "https://api.vercel.com";

type VercelConfig = { token: string; projectId: string; teamId?: string };

/**
 * Configuração vinda das variáveis secretas.
 *
 * Sem token, a operação é RECUSADA com mensagem explícita em vez de tentar e
 * falhar com 401 traduzido para "erro interno". Enquanto o projeto na Vercel
 * não existir, esta tela inteira responde essa frase — que é a informação
 * correta, e não um defeito.
 */
function config(): VercelConfig {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    throw new ApiError(
      503,
      "A hospedagem dos sites ainda não está configurada nesta instalação. Fale com o suporte.",
    );
  }

  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID || undefined };
}

/** `true` quando dá para falar com a Vercel — a tela usa para não prometer o que não entrega. */
export function hostingReady(): boolean {
  return Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID);
}

type VercelError = { error?: { code?: string; message?: string } };

/**
 * Erros que a revenda pode resolver sozinha, traduzidos.
 *
 * O resto sobe como 502: se a Vercel recusou por um motivo nosso — token sem
 * escopo, projeto errado — não adianta mandar a revenda mexer no DNS dela.
 */
const KNOWN: Record<string, string> = {
  domain_already_in_use: "Este domínio já está em uso em outra conta.",
  domain_taken: "Este domínio já está em uso em outra conta.",
  invalid_domain: "Este endereço não é um domínio válido.",
  forbidden: "Não temos permissão para gerenciar este domínio.",
  not_found: "Domínio não encontrado na hospedagem.",
};

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { token, teamId } = config();
  const url = new URL(`${BASE}${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // rede caiu ou estourou o tempo: não é culpa de quem cadastrou o domínio
    throw new ApiError(502, "Não consegui falar com a hospedagem. Tente de novo em instantes.");
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => null)) as (T & VercelError) | null;

  if (!response.ok) {
    const code = payload?.error?.code ?? "";
    const known = KNOWN[code];
    if (known) throw new ApiError(400, known);
    throw new ApiError(
      502,
      `A hospedagem recusou: ${payload?.error?.message ?? `respondeu ${response.status}`}`,
    );
  }

  return payload as T;
}

type ProjectDomain = {
  name: string;
  verified?: boolean;
  verification?: { type: string; domain: string; value: string; reason?: string }[];
};

type DomainConfig = { misconfigured?: boolean };

const RECORD_TYPES = new Set(["A", "CNAME", "TXT"]);

/**
 * Registros de verificacao da Vercel no formato que a nossa tela mostra.
 *
 * A Vercel devolve o host inteiro em `domain` ("_vercel.revenda.com.br") e o
 * painel de DNS da revenda pede so o rotulo ("_vercel"). Quem cola o host
 * inteiro no campo "nome" cria _vercel.revenda.com.br.revenda.com.br e passa a
 * tarde sem entender por que nao valida.
 */
function toRecords(domain: ProjectDomain): DnsRecord[] {
  return (domain.verification ?? []).map((item) => {
    const type = item.type.toUpperCase();
    return {
      type: (RECORD_TYPES.has(type) ? type : "TXT") as DnsRecord["type"],
      name: dnsRecordName(item.domain),
      value: item.value,
      purpose: "posse" as const,
    };
  });
}

export async function addDomain(domain: string): Promise<void> {
  const { projectId } = config();
  await request(`/v10/projects/${projectId}/domains`, {
    method: "POST",
    body: { name: domain },
  });
}

export async function removeDomain(domain: string): Promise<void> {
  const { projectId } = config();
  await request(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}`, {
    method: "DELETE",
  });
}

/**
 * Estado atual do domínio, já com a tentativa de verificação disparada.
 *
 * As duas chamadas vão juntas porque a pergunta "está no ar?" precisa das
 * duas respostas: `verified` diz se provamos a posse, `misconfigured` diz se o
 * DNS aponta para cá. Uma sem a outra dá diagnóstico errado — domínio
 * verificado e mal apontado responderia "tudo certo" e o site não abriria.
 */
export async function domainState(domain: string): Promise<VercelDomainState> {
  const { projectId } = config();
  const encoded = encodeURIComponent(domain);

  const [project, dns] = await Promise.all([
    request<ProjectDomain>(`/v9/projects/${projectId}/domains/${encoded}`),
    request<DomainConfig>(`/v6/domains/${encoded}/config`),
  ]);

  return {
    verified: project.verified === true,
    misconfigured: dns.misconfigured === true,
    missing: toRecords(project),
  };
}

/** Pede à Vercel que confira o TXT de posse agora, em vez de esperar o ciclo dela. */
export async function verifyDomain(domain: string): Promise<void> {
  const { projectId } = config();
  await request(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify`, {
    method: "POST",
  });
}
