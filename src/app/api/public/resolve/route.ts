import { jsonOk, notFound, withApi } from "@/lib/http";
import { assertSitesKey, tenantSlugByHost } from "@/lib/services/public-api";

export const dynamic = "force-dynamic";

/**
 * Host -> revenda.
 *
 * O app dos sites chama isto antes de qualquer outra coisa: ele recebe um
 * domínio e precisa saber qual loja renderizar.
 */
export const GET = withApi(async (request: Request) => {
  assertSitesKey(request);

  const host = new URL(request.url).searchParams.get("host") ?? "";
  const slug = await tenantSlugByHost(host);
  if (!slug) throw notFound("Domínio não cadastrado");

  return jsonOk(
    { slug },
    // o vínculo domínio→revenda quase nunca muda; cachear evita uma ida ao
    // banco por visita
    { headers: { "cache-control": "public, max-age=300, s-maxage=300" } },
  );
});
