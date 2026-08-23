import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/services/site";
import { getTenantCoreBySlug } from "@/lib/tenant/service";
import { themeToCssVariables } from "@/templates/contract";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteData(slug);
  if (!site) return { title: "Site indisponível" };

  return {
    title: { default: site.name, template: `%s · ${site.name}` },
    description: site.aboutText?.slice(0, 160) ?? `Estoque de veículos da ${site.name}.`,
  };
}

export default async function PublicSiteLayout({ children, params }: Props) {
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant) notFound();

  const site = await getSiteData(slug);
  const cssVariables = site ? themeToCssVariables(site.theme) : {};

  return <div style={cssVariables as React.CSSProperties}>{children}</div>;
}
