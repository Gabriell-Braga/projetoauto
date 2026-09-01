import { buildStockJson } from "@/lib/integrations/stock-feed";
import { getOrigin } from "@/lib/seo/urls";
import { loadFeedData } from "@/lib/services/stock-feed-data";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

/** Mesmo feed em JSON, para quem integra por conta própria. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant || !isPublicSiteAvailable(tenant)) {
    return Response.json({ erro: "Não encontrado" }, { status: 404 });
  }

  const origin = await getOrigin();
  const { store, vehicles } = await loadFeedData(tenant.id, tenant.name, slug, origin);

  return Response.json(buildStockJson(store, vehicles, new Date()), {
    headers: { "cache-control": "public, max-age=600, s-maxage=600" },
  });
}
