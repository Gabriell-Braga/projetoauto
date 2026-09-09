import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles, type VehicleStatus } from "@/db/schema";
import { jsonOk, notFound, withApi } from "@/lib/http";
import { assertSitesKey } from "@/lib/services/public-api";
import { getSiteData } from "@/lib/services/site";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";
import { getTemplate } from "@projetoauto/site-kit/registry";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

const PUBLIC_STATUSES: VehicleStatus[] = ["available", "reserved"];
const MAX_URLS = 2000;

/**
 * O que entra no sitemap do site da revenda.
 *
 * Devolve dados, não XML: quem monta o arquivo é quem conhece o domínio. No
 * painel as URLs vivem sob `/r/<slug>`, no domínio próprio saem da raiz — e o
 * `<loc>` precisa ser absoluto e correto, ou o buscador ignora a entrada.
 *
 * A listagem comum não serve aqui: ela pagina de doze em doze e não devolve
 * `updatedAt`, que é o que dá sentido ao `lastmod`.
 */
export const GET = withApi(async (request: Request, { params }: Params) => {
  assertSitesKey(request);
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant) throw notFound("Revenda não encontrada");

  const site = await getSiteData(slug);
  if (!site) throw notFound("Revenda não encontrada");

  const db = await getDb();
  const rows = await db
    .select({ slug: vehicles.slug, updatedAt: vehicles.updatedAt })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenant.id), inArray(vehicles.status, PUBLIC_STATUSES)))
    .orderBy(desc(vehicles.updatedAt))
    .limit(MAX_URLS);

  /*
   * As páginas institucionais só entram quando o template as implementa.
   *
   * Anunciar no sitemap uma URL que responde 404 é o jeito mais rápido de
   * perder confiança do buscador. Privacidade e termos ficam de fora de
   * propósito: são `noindex` e existem para quem procura por elas.
   */
  const template = getTemplate(site.templateId);

  return jsonOk(
    {
      available: isPublicSiteAvailable(tenant),
      pages: {
        financing: Boolean(template.Financing),
        sellCar: Boolean(template.SellCar),
        about: Boolean(template.About),
      },
      vehicles: rows.map((row) => ({
        slug: row.slug,
        updatedAt: row.updatedAt.toISOString(),
      })),
    },
    { headers: { "cache-control": "public, max-age=300, s-maxage=300" } },
  );
});
