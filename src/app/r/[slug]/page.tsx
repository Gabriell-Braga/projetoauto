import { loadPublicSite, PUBLIC_VEHICLE_STATUSES } from "@/lib/services/public-site";
import { toVehicleCard } from "@/lib/services/site";
import { listStockFacets, listVehicles } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  const statuses = [...PUBLIC_VEHICLE_STATUSES];

  const [featured, latest, facets] = await Promise.all([
    listVehicles(context.tenantId, { statuses, featured: true, pageSize: 8 }),
    listVehicles(context.tenantId, { statuses, pageSize: 8, sort: "recentes" }),
    listStockFacets(context.tenantId),
  ]);

  const Home = context.template.Home;

  return (
    <Home
      site={context.site}
      links={context.links}
      featured={featured.items.map(toVehicleCard)}
      latest={latest.items
        .filter((vehicle) => !featured.items.some((item) => item.id === vehicle.id))
        .map(toVehicleCard)}
      facets={facets}
      totalVehicles={latest.total}
    />
  );
}

