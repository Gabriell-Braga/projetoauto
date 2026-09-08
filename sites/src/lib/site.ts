import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { buildSiteLinks } from "@projetoauto/site-kit/links";
import { getTemplate } from "@projetoauto/site-kit/registry";
import type { SiteData, SiteLinks, TemplateModule } from "@projetoauto/site-kit/contract";
import { fetchSite, slugForHost } from "./panel";

export type SiteContext = {
  slug: string;
  site: SiteData;
  templateId: string;
  links: SiteLinks;
  template: TemplateModule;
  gtmCode: string | null;
};

/**
 * De qual revenda e a requisicao.
 *
 * Aqui nao existe `/r/<slug>` na URL: cada revenda tem o dominio dela, e o
 * `Host` e a unica pista. Um dominio que nao esta cadastrado da 404 — e o que
 * um endereco apontado para ca por engano merece.
 */
export async function currentSlug(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  const slug = await slugForHost(host);
  if (slug) return slug;

  /*
   * Escape para desenvolvimento e para a primeira publicacao.
   *
   * Antes de existir dominio, o endereco e o localhost ou o `.vercel.app` do
   * projeto — nenhum dos dois esta cadastrado, e sem isto nao haveria como
   * abrir o site uma unica vez para conferir se subiu de pe.
   *
   * A variavel NAO deve existir em producao. Enquanto ela estiver vazia,
   * dominio desconhecido da 404, que e o que um endereco apontado para ca por
   * engano merece — nunca o site de outra revenda.
   */
  const fallback = process.env.FALLBACK_TENANT_SLUG;
  if (fallback) return fallback;

  notFound();
}

/**
 * Tudo que uma pagina precisa antes de desenhar.
 *
 * Assinatura em atraso nao da 404: manda para a pagina neutra de
 * indisponibilidade. O dominio responde, e a revenda nao abre chamado de DNS
 * por um problema de cobranca.
 */
export async function loadSite(): Promise<SiteContext> {
  const slug = await currentSlug();
  const { site, templateId, available, gtmCode } = await fetchSite(slug);

  if (!available) redirect("/indisponivel");

  return {
    slug,
    site,
    templateId,
    // dominio proprio: os links saem da raiz, sem prefixo
    links: buildSiteLinks("", site.contact.whatsappDigits),
    template: getTemplate(templateId),
    gtmCode,
  };
}
