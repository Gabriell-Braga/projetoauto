import { jsonOk, notFound, withApi } from "@/lib/http";
import { assertSitesKey } from "@/lib/services/public-api";
import { financingOptions } from "@/lib/services/financing-options";
import { getTenantCoreBySlug } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

/**
 * Os veículos que o simulador oferece.
 *
 * Existe separado da listagem porque a regra não é "o estoque": entra só o que
 * tem preço publicado, ordenado por valor, e o carro que veio pela URL é
 * garantido na lista mesmo fora do limite. Deixar o app dos sites remontar
 * isso a partir do estoque faria a mesma regra existir em dois lugares — e o
 * link "Simular financiamento" de uma ficha cairia numa página com outro carro
 * selecionado no dia em que as duas divergissem.
 */
export const GET = withApi(async (request: Request, { params }: Params) => {
  assertSitesKey(request);
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant) throw notFound("Revenda não encontrada");

  const preselected = new URL(request.url).searchParams.get("veiculo") ?? undefined;
  const options = await financingOptions(tenant.id, preselected);

  return jsonOk(
    { options },
    { headers: { "cache-control": "public, max-age=60, s-maxage=60" } },
  );
});
