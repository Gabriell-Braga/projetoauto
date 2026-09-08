import { requireApiTenant } from "@/lib/auth/guards";
import { jsonOk, notFound, withApi } from "@/lib/http";
import { refreshDomain } from "@/lib/services/domains";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Confere o DNS agora.
 *
 * Não gera linha de auditoria: é leitura, a revenda vai clicar várias vezes
 * enquanto espera a propagação, e encher o log com isso esconderia o que
 * importa lá dentro.
 */
export const POST = withApi(async (_request: Request, { params }: Params) => {
  const context = await requireApiTenant("site:write");
  const { id } = await params;

  const domain = await refreshDomain(context.tenant.id, id);
  if (!domain) throw notFound("Endereço não encontrado");

  return jsonOk({ domain });
});
