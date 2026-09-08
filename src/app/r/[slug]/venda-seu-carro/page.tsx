import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite } from "@/lib/services/public-site";
import { SellCarForm } from "@/templates/shared/sell-car-form";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Venda seu carro",
    description: `Envie os dados do seu veículo e receba uma avaliação da ${context.site.name}.`,
  };
}

export default async function TenantSellCarPage({ params }: Props) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);

  const SellCar = context.template.SellCar;
  if (!SellCar) notFound();

  return (
    <SellCar
      site={context.site}
      links={context.links}
      sellForm={<SellCarForm tenantSlug={slug} />}
    />
  );
}
