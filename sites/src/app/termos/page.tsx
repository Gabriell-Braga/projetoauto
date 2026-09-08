import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadSite } from "~/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await loadSite();
  return {
    title: "Termos de Uso",
    description: `Condições de uso do site da ${site.name}.`,
    // página jurídica não disputa busca; existe para quem procura por ela
    robots: { index: false, follow: true },
  };
}

export default async function LegalPage() {
  const { site, links, template } = await loadSite();

  const Legal = template.Legal;
  /*
   * Sem texto escrito pela revenda, a página não existe.
   *
   * Publicar um modelo genérico assinado pela loja seria pior que não ter
   * página: ela passaria a responder por promessas que ninguém leu, e o
   * rodapé apontaria para uma casca vazia.
   */
  if (!Legal || !site.legal.terms) notFound();

  return (
    <Legal
      site={site}
      links={links}
      kind="termos"
      title="Termos de Uso"
      body={site.legal.terms}
      updatedAt={site.legal.updatedAt}
    />
  );
}
