import { fetchSite } from "~/lib/panel";
import { currentSlug } from "~/lib/site";
import { absoluteUrl } from "~/lib/urls";

export const dynamic = "force-dynamic";

/**
 * robots no domínio da revenda.
 *
 * Revenda fora do ar pede desindexação: enquanto a assinatura estiver
 * pendente, o site não deve continuar aparecendo no Google com preços que a
 * loja não está praticando.
 */
export async function GET() {
  const slug = await currentSlug();
  const { available } = await fetchSite(slug);
  const origin = await absoluteUrl();

  if (!available) {
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  /*
   * `/api` fica de fora do índice: é a rota de repasse dos formulários, não
   * conteúdo. `/media` continua liberado — é onde estão as fotos dos
   * anúncios, e o buscador de imagens precisa alcançá-las.
   */
  const corpo = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(corpo, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
