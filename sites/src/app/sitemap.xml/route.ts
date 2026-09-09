import { fetchSitemap } from "~/lib/panel";
import { currentSlug } from "~/lib/site";
import { absoluteUrl } from "~/lib/urls";

export const dynamic = "force-dynamic";

/**
 * Sitemap no domínio da revenda.
 *
 * Existia no site servido pelo painel e não tinha vindo para cá — o app da
 * Vercel respondia 404, e um site sem sitemap é indexado mais devagar e sem
 * orientação de prioridade.
 *
 * As URLs são absolutas e no domínio do cliente. Aqui elas saem da raiz, ao
 * contrário do painel, onde vivem sob `/r/<slug>`.
 */
export async function GET() {
  const slug = await currentSlug();
  const dados = await fetchSitemap(slug);

  if (!dados || !dados.available) {
    return new Response("Não encontrado", { status: 404 });
  }

  const origin = await absoluteUrl();
  const agora = new Date().toISOString();

  /*
   * Página que o template não implementa fica de fora.
   *
   * Anunciar uma URL que responde 404 é o jeito mais rápido de perder
   * confiança do buscador. Privacidade e termos também não entram: são
   * `noindex` e existem para quem procura por elas, não para disputar busca.
   */
  const opcionais = [
    dados.pages.financing ? { path: "/financiamento", priority: "0.6" } : null,
    dados.pages.sellCar ? { path: "/venda-seu-carro", priority: "0.6" } : null,
    dados.pages.about ? { path: "/sobre", priority: "0.4" } : null,
  ].filter((item) => item !== null);

  const entradas = [
    { loc: "/", lastmod: agora, priority: "1.0", changefreq: "daily" },
    { loc: "/estoque", lastmod: agora, priority: "0.9", changefreq: "daily" },
    { loc: "/contato", lastmod: agora, priority: "0.5", changefreq: "monthly" },
    ...opcionais.map((item) => ({
      loc: item.path,
      lastmod: agora,
      priority: item.priority,
      changefreq: "monthly",
    })),
    ...dados.vehicles.map((veiculo) => ({
      loc: `/veiculo/${veiculo.slug}`,
      lastmod: veiculo.updatedAt,
      priority: "0.8",
      changefreq: "weekly",
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entradas
  .map(
    (entrada) => `  <url>
    <loc>${escapeXml(`${origin}${entrada.loc === "/" ? "" : entrada.loc}`)}</loc>
    <lastmod>${entrada.lastmod}</lastmod>
    <changefreq>${entrada.changefreq}</changefreq>
    <priority>${entrada.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
