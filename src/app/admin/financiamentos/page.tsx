import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { listFinancings } from "@/lib/services/financings";
import { FinancingsPanel } from "./financings-panel";

export const metadata: Metadata = { title: "Financiamentos" };
export const dynamic = "force-dynamic";

export default async function FinancingsPage() {
  const context = await requireTenantPage("financings:read");

  if (!(await tenantHasFeature(context.tenant.id, "gestao_financiamentos"))) {
    return (
      <>
        <PageHeader title="Financiamentos" description="Propostas enviadas aos bancos." />
        <FeatureLocked
          title="Gestão de financiamentos não está no plano desta revenda"
          description="Ela acompanha cada proposta — banco, entrada, parcelas e resposta — junto do lead e do veículo."
        />
      </>
    );
  }

  const rows = await listFinancings(context.tenant.id);

  return (
    <>
      <PageHeader
        title="Financiamentos"
        description={`${rows.length} proposta(s) registradas.`}
      />
      <FinancingsPanel
        financings={rows.map((row) => ({
          id: row.id,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          vehicleLabel: row.vehicleLabel,
          bank: row.bank,
          vehiclePriceCents: row.vehiclePriceCents,
          downPaymentCents: row.downPaymentCents,
          financedCents: row.financedCents,
          installments: row.installments,
          installmentCents: row.installmentCents,
          status: row.status,
          notes: row.notes,
          createdAt: row.createdAt.toISOString(),
        }))}
        canWrite={can(context.role, "financings:write")}
      />
    </>
  );
}
