import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantDomains, tenants } from "@/db/schema";
import { ApiError } from "@/lib/http";
import { normalizeDomain } from "@/lib/integrations/domains";

/**
 * API pública consumida pelo app dos sites.
 *
 * O painel roda no Webflow Cloud, onde existe o binding do D1; o app dos sites
 * roda na Vercel, onde ele não existe. Esta é a única ponte entre os dois — o
 * app dos sites nunca fala com o banco, só com estas rotas.
 *
 * O que trafega aqui é conteúdo de site público: os mesmos dados que qualquer
 * visitante vê na página. Não há dado de painel, de lead ou de usuário.
 */

/**
 * Chave compartilhada entre o painel e o app dos sites.
 *
 * O conteúdo é público de qualquer forma, então isto não é segredo — é
 * torniquete. Sem ela, qualquer um poderia varrer o catálogo inteiro de todas
 * as revendas em rajada e gastar a cota de leitura do D1, e a conta chegaria
 * para a gente.
 *
 * Limitar por IP não serve: as chamadas do app dos sites saem todas dos
 * endereços da Vercel, então o limite cairia sobre o tráfego legítimo primeiro.
 *
 * Quando a variável não está configurada, a rota fica aberta. É o que permite
 * desenvolver e testar sem cerimônia; em produção ela é definida.
 */
export function assertSitesKey(request: Request): void {
  const expected = process.env.SITES_API_KEY;
  if (!expected) return;

  const provided = request.headers.get("x-sites-key");
  if (provided !== expected) {
    throw new ApiError(401, "Chave inválida.");
  }
}

/**
 * Descobre de qual revenda é um endereço.
 *
 * É a primeira coisa que o app dos sites faz a cada requisição: ele recebe um
 * `Host` e precisa saber que loja renderizar. A busca é pelo domínio exato —
 * `www.revenda.com.br` e `revenda.com.br` são registros separados, e é assim
 * que a revenda os cadastra.
 */
export async function tenantSlugByHost(host: string): Promise<string | null> {
  const parsed = normalizeDomain(host);
  if (!parsed.ok) return null;

  const db = await getDb();
  const rows = await db
    .select({ slug: tenants.slug, status: tenants.status })
    .from(tenantDomains)
    .innerJoin(tenants, eq(tenants.id, tenantDomains.tenantId))
    .where(eq(tenantDomains.domain, parsed.domain))
    .limit(1);

  const row = rows[0];
  /*
   * Revenda apagada não responde nem pelo domínio dela.
   *
   * Suspensa continua resolvendo: quem decide o que mostrar nesse caso é a
   * rota de dados, que devolve a página de indisponibilidade. Barrar aqui
   * daria 404 de domínio inexistente, e a revenda concluiria que o DNS
   * quebrou quando o problema é a assinatura.
   */
  if (!row || row.status === "deleted") return null;
  return row.slug;
}
