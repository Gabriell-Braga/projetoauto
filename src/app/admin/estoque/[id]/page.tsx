import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/shell";
import { PhotoManager } from "@/components/admin/photo-manager";
import { VehicleStatusBadge } from "@/components/admin/status-badges";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { getVehicle } from "@/lib/services/vehicles";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";
import { DeleteVehicleButton } from "./delete-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const context = await requireTenantPage("vehicles:read");
  const { id } = await params;
  const found = await getVehicle(context.tenant.id, id);
  return {
    title: found ? `${found.vehicle.brand} ${found.vehicle.model}` : "Veículo",
  };
}

export default async function EditVehiclePage({ params }: Props) {
  const context = await requireTenantPage("vehicles:read");
  const { id } = await params;

  const found = await getVehicle(context.tenant.id, id);
  if (!found) notFound();

  const { vehicle, photos } = found;
  const canWrite = can(context.role, "vehicles:write") && context.access === "full";

  return (
    <>
      <PageHeader
        title={`${vehicle.brand} ${vehicle.model}`}
        description={vehicle.version ?? undefined}
        actions={
          <>
            {vehicle.status !== "draft" ? (
              <Link
                href={tenantPublicPath(context.tenant.slug, `/veiculo/${vehicle.slug}`)}
                target="_blank"
              >
                <span className="inline-flex h-10 items-center rounded-lg border border-ink-200 bg-white px-4 text-sm font-medium text-ink-900 hover:bg-ink-50">
                  Ver no site
                </span>
              </Link>
            ) : null}
            <Link href="/admin/estoque">
              <span className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-ink-600 hover:bg-ink-100">
                Voltar
              </span>
            </Link>
          </>
        }
      />

      <div className="mb-5">
        <VehicleStatusBadge status={vehicle.status} />
      </div>

      <div className="space-y-4">
        <PhotoManager
          vehicleId={vehicle.id}
          disabled={!canWrite}
          photos={photos.map((photo) => ({
            id: photo.id,
            variants: photo.variants,
            isCover: photo.isCover,
            position: photo.position,
          }))}
        />

        <VehicleForm
          readOnly={!canWrite}
          initial={{
            id: vehicle.id,
            brand: vehicle.brand,
            model: vehicle.model,
            version: vehicle.version ?? "",
            yearManufacture: vehicle.yearManufacture,
            yearModel: vehicle.yearModel,
            mileageKm: vehicle.mileageKm,
            priceCents: vehicle.priceCents,
            priceOnRequest: vehicle.priceOnRequest,
            transmission: vehicle.transmission ?? "",
            fuel: vehicle.fuel ?? "",
            bodyType: vehicle.bodyType ?? "",
            color: vehicle.color ?? "",
            doors: vehicle.doors ? String(vehicle.doors) : "",
            licensePlateEnd: vehicle.licensePlateEnd ?? "",
            options: vehicle.options ?? [],
            description: vehicle.description ?? "",
            status: vehicle.status,
            featured: vehicle.featured,
          }}
        />

        {canWrite ? (
          <DeleteVehicleButton
            vehicleId={vehicle.id}
            label={`${vehicle.brand} ${vehicle.model}`}
          />
        ) : null}
      </div>
    </>
  );
}
