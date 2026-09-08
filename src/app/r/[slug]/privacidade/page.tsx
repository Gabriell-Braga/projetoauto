import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite } from "@/lib/services/public-site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Política de Privacidade",
    description: `Como a ${context.site.name} trata os dados enviados pelo site.`,
    // página jurídica não disputa busca; existe para quem procura por ela
    robots: { index: false, follow: true },
  };
}

export default async function TenantPrivacyPage({ params }: Props) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);

  const Legal = context.template.Legal;
  /*
   * Sem texto escrito pela revenda, a página não existe.
   *
   * Publicar um modelo genérico assinado pela loja seria pior que não ter
   * página: ela passaria a responder por promessas que ninguém leu, e o
   * rodapé apontaria para uma casca vazia.
   */
  if (!Legal || !context.site.legal.privacy) notFound();

  return (
    <Legal
      site={context.site}
      links={context.links}
      kind="privacidade"
      title="Política de Privacidade"
      body={context.site.legal.privacy}
      updatedAt={context.site.legal.updatedAt}
    />
  );
}
