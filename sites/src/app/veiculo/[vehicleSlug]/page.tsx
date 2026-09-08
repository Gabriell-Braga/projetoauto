import type { Metadata } from "next";
import { JsonLd, breadcrumbJsonLd, vehicleJsonLd } from "@projetoauto/site-kit/jsonld";
import { LeadForm } from "@projetoauto/site-kit/shared/lead-form";
import { FinancingEstimator } from "@projetoauto/site-kit/shared/financing-form";
import { SellCarTeaser } from "@projetoauto/site-kit/shared/sell-car-form";
import { fetchVehicle } from "~/lib/panel";
import { loadSite } from "~/lib/site";
import { absoluteUrl } from "~/lib/urls";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vehicleSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vehicleSlug } = await params;
  const { slug, site } = await loadSite();
  const { vehicle } = await fetchVehicle(slug, vehicleSlug);

  const title = `${vehicle.title} ${vehicle.yearLabel}`;
  const description = `${title} com ${vehicle.mileageLabel} por ${vehicle.priceLabel} na ${site.name}.`;
  const url = await absoluteUrl(`/veiculo/${vehicle.slug}`);
  const image = vehicle.photos[0]?.full ?? vehicle.coverUrl;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "pt_BR",
      siteName: site.name,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { vehicleSlug } = await params;
  const { slug, site, links, template, templateId } = await loadSite();
  const { vehicle, related } = await fetchVehicle(slug, vehicleSlug);

  const [vehicleUrl, homeUrl, stockUrl] = await Promise.all([
    absoluteUrl(`/veiculo/${vehicle.slug}`),
    absoluteUrl(),
    absoluteUrl("/estoque"),
  ]);

  const Detail = template.VehicleDetail;
  const tone = templateId === "template-2-dark" ? "dark" : "light";

  return (
    <>
      <JsonLd data={vehicleJsonLd(vehicle, site, vehicleUrl)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Início", url: homeUrl },
          { name: "Estoque", url: stockUrl },
          { name: vehicle.title, url: vehicleUrl },
        ])}
      />
      <Detail
        site={site}
        links={links}
        vehicle={vehicle}
        related={related}
        leadForm={
          <LeadForm
            tenantSlug={slug}
            vehicleId={vehicle.id}
            vehicleLabel={`${vehicle.title} ${vehicle.yearLabel}`}
            tone={tone}
          />
        }
        /*
         * Os dois cards do "Facilite sua compra": simulador com o preço deste
         * veículo, e o card de troca. Nenhum dos dois envia daqui — os dois
         * levam para a página completa, onde a pessoa dá o contato uma vez só.
         */
        financingForm={
          !vehicle.priceOnRequest ? (
            <FinancingEstimator
              defaults={site.financing}
              initialPriceCents={vehicle.priceCents}
              continueHref={`${links.financing}?veiculo=${vehicle.id}`}
              continueLabel="Simular condições"
            />
          ) : null
        }
        tradeInForm={<SellCarTeaser href={links.sellCar} />}
      />
    </>
  );
}
