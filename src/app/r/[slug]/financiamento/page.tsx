import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadPublicSite } from "@/lib/services/public-site";
import { financingOptions } from "@/lib/services/financing-options";
import { FinancingForm } from "@/templates/shared/financing-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ veiculo?: string; entrada?: string; prazo?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Financiamento",
    description: `Simule o financiamento do seu próximo carro na ${context.site.name}.`,
  };
}

/** Centavos vindos da home; lixo na URL vira ausência, não zero. */
function toCents(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

function toMonths(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 120 ? parsed : undefined;
}

export default async function TenantFinancingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { veiculo, entrada, prazo } = await searchParams;
  const context = await loadPublicSite(slug);

  /*
   * Template sem a página não é erro nosso nem da revenda: é o desenho dela
   * que não tem essa tela. 404 é a resposta honesta, e evita servir uma
   * página em branco com cabeçalho e rodapé de outro template.
   */
  const Financing = context.template.Financing;
  if (!Financing) notFound();

  const vehicles = await financingOptions(context.tenantId, veiculo);

  return (
    <Financing
      site={context.site}
      links={context.links}
      vehicles={vehicles}
      defaults={context.site.financing}
      simulatorForm={
        <FinancingForm
          tenantSlug={slug}
          vehicles={vehicles}
          defaults={context.site.financing}
          preselectedVehicleId={veiculo}
          initialDownCents={toCents(entrada)}
          initialInstallments={toMonths(prazo)}
        />
      }
    />
  );
}
