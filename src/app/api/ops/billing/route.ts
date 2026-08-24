import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { billingStatus, tenants, type BillingStatus, type TenantStatus } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { registerBillingEvent } from "@/lib/services/tenants";
import { DAY_MS, invalidateTenantCache } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

type Transition = {
  tenantId: string;
  slug: string;
  name: string;
  from: BillingStatus;
  to: BillingStatus;
  daysOverdue: number;
};

/**
 * Aplica a régua de inadimplência: vencido vira `inadimplente` e, passada a
 * tolerância, vira `suspenso`.
 *
 * O bloqueio em si NÃO depende deste job — `effectiveBillingStatus()` já
 * calcula a situação real a cada request. Este endpoint existe para o banco
 * refletir a realidade e para o histórico registrar quando cada virada
 * aconteceu. Pode ser chamado por qualquer agendador (cron do Cloudflare,
 * GitHub Actions, cron-job.org) com o header `x-ops-secret`.
 */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  const now = Date.now();
  const db = await getDb();

  const rows = await db
    .select({
      tenantId: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      status: billingStatus.status,
      graceDays: billingStatus.graceDays,
      currentDueDate: billingStatus.currentDueDate,
    })
    .from(billingStatus)
    .innerJoin(tenants, eq(tenants.id, billingStatus.tenantId))
    .where(
      and(
        ne(tenants.status, "deleted" as TenantStatus),
        ne(billingStatus.status, "suspenso" as BillingStatus),
      ),
    );

  const transitions: Transition[] = [];

  for (const row of rows) {
    if (!row.currentDueDate) continue;

    const overdueMs = now - row.currentDueDate.getTime();
    if (overdueMs <= 0) continue;

    const target: BillingStatus =
      overdueMs > row.graceDays * DAY_MS ? "suspenso" : "inadimplente";
    if (target === row.status) continue;

    transitions.push({
      tenantId: row.tenantId,
      slug: row.slug,
      name: row.name,
      from: row.status,
      to: target,
      daysOverdue: Math.floor(overdueMs / DAY_MS),
    });
  }

  if (!dryRun) {
    for (const transition of transitions) {
      await db
        .update(billingStatus)
        .set({ status: transition.to })
        .where(eq(billingStatus.tenantId, transition.tenantId));

      await registerBillingEvent({
        tenantId: transition.tenantId,
        type: "status_change",
        statusFrom: transition.from,
        statusTo: transition.to,
        note:
          transition.to === "suspenso"
            ? `Suspensão automática: ${transition.daysOverdue} dia(s) de atraso.`
            : `Marcada como inadimplente: vencimento passou há ${transition.daysOverdue} dia(s).`,
        actor: { userId: null, email: "sistema" },
      });

      await invalidateTenantCache({ id: transition.tenantId, slug: transition.slug });

      await logAudit(
        { userId: null, email: "sistema", role: null, tenantId: transition.tenantId, impersonated: false },
        {
          action: "billing.auto_status",
          entity: "billing_status",
          entityId: transition.tenantId,
          tenantId: transition.tenantId,
          metadata: { from: transition.from, to: transition.to, daysOverdue: transition.daysOverdue },
        },
        request,
      );
    }
  }

  return jsonOk({
    dryRun,
    evaluated: rows.length,
    changed: transitions.length,
    transitions: transitions.map((item) => ({
      revenda: item.name,
      slug: item.slug,
      de: item.from,
      para: item.to,
      diasEmAtraso: item.daysOverdue,
    })),
  });
});
