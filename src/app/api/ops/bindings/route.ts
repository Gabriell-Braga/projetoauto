import { getBindings } from "@/lib/cloudflare";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";

export const dynamic = "force-dynamic";

/**
 * Quais bindings o Worker realmente enxerga.
 *
 * Existe porque um binding ausente não se anuncia: ele chega como `undefined`,
 * e a primeira chamada estoura com "cannot read properties of undefined" bem
 * longe da causa. Foi assim que as fotos sumiram do site em produção — 500 de
 * corpo vazio, sem nada apontando para o bucket.
 *
 * Devolve só NOMES e o tipo aparente. Nenhum valor sai daqui: o `env` do
 * Worker carrega os segredos do painel junto com os bindings, e listar
 * conteúdo transformaria uma rota de diagnóstico num vazamento.
 */
const ESPERADOS = ["DB", "CACHE", "MEDIA"] as const;

export const GET = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const env = (await getBindings()) as unknown as Record<string, unknown>;

  const bindings = ESPERADOS.map((nome) => {
    const valor = env[nome];
    return {
      nome,
      presente: valor !== undefined && valor !== null,
      // o binding do Cloudflare é um objeto com métodos; a forma já denuncia
      // quando veio uma string de variável de ambiente no lugar
      tipo: valor === undefined || valor === null ? null : typeof valor,
    };
  });

  return jsonOk({
    bindings,
    faltando: bindings.filter((b) => !b.presente).map((b) => b.nome),
  });
});
