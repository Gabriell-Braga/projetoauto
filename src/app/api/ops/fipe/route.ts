import { getBindings } from "@/lib/cloudflare";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";

export const dynamic = "force-dynamic";

/**
 * Saúde da tabela FIPE.
 *
 * Responde as duas perguntas que decidem o conserto: o cache está guardando
 * (senão a cota de 500 por dia se esgota sozinha) e a API está respondendo
 * agora. Sem isso, "a FIPE não responde" vira adivinhação entre limite de
 * cota, cache quebrado e serviço fora do ar — cada um com solução diferente.
 */
export const GET = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const report: Record<string, unknown> = {};

  // 1. o cache está funcionando?
  try {
    const { CACHE } = await getBindings();
    if (!CACHE) {
      report.cache = "BINDING AUSENTE — toda consulta vai direto à FIPE";
    } else {
      const cached = await CACHE.get("fipe:brands", "json");
      report.cache = cached ? "ok, marcas em cache" : "vazio (ainda não consultado)";
    }
  } catch (error) {
    report.cache = `falhou: ${error instanceof Error ? error.message : String(error)}`;
  }

  // 2. a API responde, e quanto da cota resta?
  const started = Date.now();
  try {
    const response = await fetch("https://parallelum.com.br/fipe/api/v1/carros/marcas", {
      headers: { accept: "application/json", "user-agent": "ProjetoAuto" },
      signal: AbortSignal.timeout(8_000),
    });

    report.upstream = {
      status: response.status,
      tempoMs: Date.now() - started,
      cotaTotal: response.headers.get("x-ratelimit-limit"),
      cotaRestante: response.headers.get("x-ratelimit-remaining"),
      cotaResetSegundos: response.headers.get("x-ratelimit-reset"),
    };
  } catch (error) {
    report.upstream = {
      erro: error instanceof Error ? error.message : String(error),
      tempoMs: Date.now() - started,
    };
  }

  return jsonOk(report);
});
