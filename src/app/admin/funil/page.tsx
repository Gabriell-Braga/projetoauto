import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { Alert } from "@/components/ui/alert";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature, tierOf } from "@/lib/api/feature-guard";
import { countLeadsWithoutStage, loadBoard } from "@/lib/services/crm";
import { FunnelBoard } from "./funnel-board";
import { FeatureLocked } from "@/components/admin/feature-locked";

export const metadata: Metadata = { title: "Funil comercial" };
export const dynamic = "force-dynamic";

export default async function FunnelPage() {
  const context = await requireTenantPage("leads:read");

  if (!(await tenantHasFeature(context.tenant.id, "funil_comercial"))) {
    return (
      <>
        <PageHeader title="Funil comercial" description="Acompanhe cada lead até a venda." />
        <FeatureLocked
          title="Funil comercial não está no plano desta revenda"
          description="Ele organiza os leads em etapas e mostra onde cada negociação parou."
        />
      </>
    );
  }

  const [columns, orphans, tier] = await Promise.all([
    loadBoard(context.tenant.id),
    countLeadsWithoutStage(context.tenant.id),
    tierOf(context.tenant.id, "funil_comercial"),
  ]);

  const total = columns.reduce((sum, column) => sum + column.cards.length, 0);

  return (
    <>
      <PageHeader
        title="Funil comercial"
        description={`${total} lead(s) no quadro. Fechados somem depois de 30 dias.`}
      />

      {orphans > 0 ? (
        <div className="mb-4">
          <Alert tone="info">
            {orphans} lead(s) chegaram antes do funil existir e ainda não têm etapa.
          </Alert>
        </div>
      ) : null}

      <FunnelBoard
        columns={columns}
        orphans={orphans}
        canWrite={can(context.role, "leads:write")}
        canConfigure={tier === "completo" && can(context.role, "leads:write")}
      />
    </>
  );
}
