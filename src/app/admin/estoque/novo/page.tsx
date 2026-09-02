import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { emptyVehicle } from "@/components/admin/vehicle-defaults";
import { requireTenantPage } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Novo veículo" };
export const dynamic = "force-dynamic";

export default async function NewVehiclePage() {
  await requireTenantPage("vehicles:write");

  return (
    <>
      <PageHeader
        title="Novo veículo"
        description="Ficha e fotos na mesma tela. Nada é publicado até você salvar."
      />
      <VehicleForm initial={emptyVehicle()} />
    </>
  );
}
