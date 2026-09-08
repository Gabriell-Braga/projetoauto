import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite } from "@/lib/services/public-site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Termos de Uso",
    description: `Condições de uso do site da ${context.site.name}.`,
    robots: { index: false, follow: true },
  };
}

export default async function TenantTermsPage({ params }: Props) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);

  const Legal = context.template.Legal;
  if (!Legal || !context.site.legal.terms) notFound();

  return (
    <Legal
      site={context.site}
      links={context.links}
      kind="termos"
      title="Termos de Uso"
      body={context.site.legal.terms}
      updatedAt={context.site.legal.updatedAt}
    />
  );
}
