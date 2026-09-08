import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite, PUBLIC_VEHICLE_STATUSES } from "@/lib/services/public-site";
import { listVehicles } from "@/lib/services/vehicles";
import { JsonLd, autoDealerJsonLd } from "@/lib/seo/jsonld";
import { tenantAbsoluteUrl } from "@/lib/seo/urls";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Sobre nós",
    description:
      context.site.aboutText?.slice(0, 160) ??
      `Conheça a ${context.site.name}: estoque, atendimento e estrutura.`,
  };
}

export default async function TenantAboutPage({ params }: Props) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);

  const About = context.template.About;
  if (!About) notFound();

  // só o total interessa aqui; a página de menor tamanho evita puxar estoque
  // inteiro para mostrar um número
  const [stock, siteUrl] = await Promise.all([
    listVehicles(context.tenantId, {
      statuses: [...PUBLIC_VEHICLE_STATUSES],
      page: 1,
      pageSize: 1,
    }),
    tenantAbsoluteUrl(slug),
  ]);

  return (
    <>
      <JsonLd data={autoDealerJsonLd(context.site, siteUrl)} />
      <About site={context.site} links={context.links} totalVehicles={stock.total} />
    </>
  );
}
