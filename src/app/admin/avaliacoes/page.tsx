import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { listAppraisals } from "@/lib/services/appraisals";
import { AppraisalsPanel } from "./appraisals-panel";

export const metadata: Metadata = { title: "Avaliações" };
export const dynamic = "force-dynamic";

export default async function AppraisalsPage() {
  const context = await requireTenantPage("appraisals:read");

  if (!(await tenantHasFeature(context.tenant.id, "avaliacao_veiculos"))) {
    return (
      <>
        <PageHeader title="Avaliações" description="Quanto pagar no carro do cliente." />
        <FeatureLocked
          title="Avaliação de veículos não está no plano desta revenda"
          description="Ela parte da tabela FIPE, desconta o que o carro precisa e registra a oferta feita — com o nome de quem decidiu."
        />
      </>
    );
  }

  const rows = await listAppraisals(context.tenant.id);

  return (
    <>
      <PageHeader
        title="Avaliações"
        description={`${rows.length} avaliação(ões) registradas.`}
      />
      <AppraisalsPanel
        appraisals={rows.map((row) => ({
          id: row.id,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          brand: row.brand,
          model: row.model,
          version: row.version,
          yearManufacture: row.yearManufacture,
          yearModel: row.yearModel,
          mileageKm: row.mileageKm,
          color: row.color,
          licensePlateEnd: row.licensePlateEnd,
          fipeCode: row.fipeCode,
          fipePriceCents: row.fipePriceCents,
          fipeReference: row.fipeReference,
          conditionCents: row.conditionCents,
          repairsCents: row.repairsCents,
          debtsCents: row.debtsCents,
          marketAdjustCents: row.marketAdjustCents,
          suggestedCents: row.suggestedCents,
          offerCents: row.offerCents,
          targetSaleCents: row.targetSaleCents,
          status: row.status,
          validUntil: row.validUntil ? row.validUntil.toISOString() : null,
          notes: row.notes,
          vehicleId: row.vehicleId,
          createdAt: row.createdAt.toISOString(),
        }))}
        canWrite={can(context.role, "appraisals:write")}
        canCreateVehicle={can(context.role, "vehicles:write")}
      />
    </>
  );
}
