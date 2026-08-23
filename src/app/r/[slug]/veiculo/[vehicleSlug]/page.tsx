import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadPublicSite, PUBLIC_VEHICLE_STATUSES } from "@/lib/services/public-site";
import { toVehicleCard, toVehicleDetail } from "@/lib/services/site";
import { getVehicleBySlug, listVehicles } from "@/lib/services/vehicles";
import { LeadForm } from "@/templates/shared/lead-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; vehicleSlug: string }>;
};

const PUBLIC = [...PUBLIC_VEHICLE_STATUSES] as string[];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, vehicleSlug } = await params;
  const context = await loadPublicSite(slug);
  const found = await getVehicleBySlug(context.tenantId, vehicleSlug);

  if (!found || !PUBLIC.includes(found.vehicle.status)) {
    return { title: "Veículo não encontrado", robots: { index: false, follow: false } };
  }

  const vehicle = toVehicleDetail(found.vehicle, found.photos);
  const title = `${vehicle.title} ${vehicle.yearLabel}`;
  const description = `${title} com ${vehicle.mileageLabel} por ${vehicle.priceLabel} na ${context.site.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: vehicle.coverUrl ? [{ url: vehicle.coverUrl }] : undefined,
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const { slug, vehicleSlug } = await params;

  const context = await loadPublicSite(slug);
  const found = await getVehicleBySlug(context.tenantId, vehicleSlug);
  if (!found || !PUBLIC.includes(found.vehicle.status)) notFound();

  const vehicle = toVehicleDetail(found.vehicle, found.photos);

  const related = await listVehicles(context.tenantId, {
    statuses: [...PUBLIC_VEHICLE_STATUSES],
    brand: found.vehicle.brand,
    pageSize: 5,
  });

  const Detail = context.template.VehicleDetail;
  const tone = context.templateId === "template-2-dark" ? "dark" : "light";

  return (
    <Detail
      site={context.site}
      links={context.links}
      vehicle={vehicle}
      related={related.items
        .filter((item) => item.id !== found.vehicle.id)
        .slice(0, 4)
        .map(toVehicleCard)}
      leadForm={
        <LeadForm
          tenantSlug={slug}
          vehicleId={vehicle.id}
          vehicleLabel={`${vehicle.title} ${vehicle.yearLabel}`}
          tone={tone}
        />
      }
    />
  );
}
