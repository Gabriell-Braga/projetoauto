import { buildStockXml } from "@/lib/integrations/stock-feed";
import { getOrigin } from "@/lib/seo/urls";
import { loadFeedData } from "@/lib/services/stock-feed-data";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

/**
 * Feed de estoque em XML, para importação por classificados.
 *
 * Público como o site: o portal busca de fora, em horários próprios, e não tem
 * onde guardar credencial. O conteúdo é o mesmo que qualquer visitante já vê
 * nas páginas de estoque.
 *
 * Revenda suspensa devolve 404 junto com o site — deixar o feed no ar
 * manteria os anúncios publicados nos portais de quem parou de pagar.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant || !isPublicSiteAvailable(tenant)) {
    return new Response("Não encontrado", { status: 404 });
  }

  const origin = await getOrigin();
  const { store, vehicles } = await loadFeedData(tenant.id, tenant.name, slug, origin);
  const xml = buildStockXml(store, vehicles, new Date());

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      // portais costumam buscar de hora em hora; cache curto evita responder
      // uma consulta ao banco inteira a cada tentativa
      "cache-control": "public, max-age=600, s-maxage=600",
    },
  });
}
