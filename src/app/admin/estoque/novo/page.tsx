import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { VehicleForm } from "@/components/admin/vehicle-form";
import { emptyVehicle } from "@/components/admin/vehicle-defaults";
import { Alert } from "@/components/ui/alert";
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
      <div className="mb-4">
        <Alert tone="info">
          Comece pela consulta FIPE: ela preenche marca, modelo e ano. As fotos podem ser enviadas
          antes de salvar, e o veículo fica como rascunho até você mudar a situação para
          &quot;Disponível&quot;.
        </Alert>
      </div>
      <VehicleForm initial={emptyVehicle()} />
    </>
  );
}
