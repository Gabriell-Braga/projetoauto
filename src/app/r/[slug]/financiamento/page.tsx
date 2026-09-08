import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite, PUBLIC_VEHICLE_STATUSES } from "@/lib/services/public-site";
import { toVehicleCard } from "@/lib/services/site";
import { listVehicles } from "@/lib/services/vehicles";
import { FinancingForm } from "@/templates/shared/financing-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ veiculo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Financiamento",
    description: `Simule o financiamento do seu próximo carro na ${context.site.name}.`,
  };
}

export default async function TenantFinancingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { veiculo } = await searchParams;
  const context = await loadPublicSite(slug);

  /*
   * Template sem a página não é erro nosso nem da revenda: é o desenho dela
   * que não tem essa tela. 404 é a resposta honesta, e evita servir uma
   * página em branco com cabeçalho e rodapé de outro template.
   */
  const Financing = context.template.Financing;
  if (!Financing) notFound();

  const stock = await listVehicles(context.tenantId, {
    statuses: [...PUBLIC_VEHICLE_STATUSES],
    sort: "preco-asc",
    page: 1,
    pageSize: 60,
  });

  // só entra no seletor o que tem preço: financiar "sob consulta" não existe
  const vehicles = stock.items.map(toVehicleCard).filter((item) => !item.priceOnRequest);

  return (
    <Financing
      site={context.site}
      links={context.links}
      vehicles={vehicles}
      defaults={context.site.financing}
      simulatorForm={
        <FinancingForm
          tenantSlug={slug}
          vehicles={vehicles.map((item) => ({
            id: item.id,
            label: `${item.title} ${item.yearLabel}`,
            priceCents: item.priceCents,
          }))}
          defaults={context.site.financing}
          preselectedVehicleId={veiculo}
        />
      }
    />
  );
}
