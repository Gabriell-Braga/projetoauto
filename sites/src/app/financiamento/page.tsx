import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FinancingEstimator, FinancingLeadForm } from "@projetoauto/site-kit/shared/financing-form";
import { fetchFinancingOptions } from "~/lib/panel";
import { loadSite } from "~/lib/site";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    veiculo?: string;
    valor?: string;
    entrada?: string;
    prazo?: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await loadSite();
  return {
    title: "Financiamento",
    description: `Simule o financiamento do seu próximo carro na ${site.name}.`,
  };
}

/** Centavos vindos de outra tela; lixo na URL vira ausência, não zero. */
function toCents(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : undefined;
}

function toMonths(value: string | undefined): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 120 ? parsed : undefined;
}

export default async function FinancingPage({ searchParams }: Props) {
  const { veiculo, valor, entrada, prazo } = await searchParams;
  const { slug, site, links, template } = await loadSite();

  /*
   * Template sem a página não é erro nosso nem da revenda: é o desenho dela
   * que não tem essa tela. 404 é a resposta honesta.
   */
  const Financing = template.Financing;
  if (!Financing) notFound();

  const vehicles = await fetchFinancingOptions(slug, veiculo);
  const escolhido = vehicles.find((item) => item.id === veiculo) ?? null;

  const entradaCents = toCents(entrada);
  const prazoMeses = toMonths(prazo) ?? site.financing.terms[0] ?? 48;

  return (
    <Financing
      site={site}
      links={links}
      vehicles={vehicles}
      defaults={site.financing}
      /*
       * A calculadora do herói trabalha por VALOR: quem chega aqui pela
       * navegação ainda não escolheu carro nenhum, e um seletor de estoque
       * vazio no topo da página seria uma porta fechada.
       */
      simulatorForm={
        <FinancingEstimator
          defaults={site.financing}
          initialPriceCents={toCents(valor) ?? escolhido?.priceCents ?? vehicles[0]?.priceCents}
          initialDownCents={entradaCents}
          initialInstallments={prazoMeses}
          continueHref="#continuar"
          continueLabel="Continuar simulação"
        />
      }
      leadForm={
        <FinancingLeadForm
          tenantSlug={slug}
          vehicleLabel={escolhido?.label}
          downPaymentCents={entradaCents ?? 0}
          installments={prazoMeses}
        />
      }
    />
  );
}
