import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { billingStatus, tenants } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { actorFromContext } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { nextDueDate, registerBillingEvent } from "@/lib/services/tenants";
import { invalidateTenantCache } from "@/lib/tenant/service";
import { billingPaymentSchema, billingUpdateSchema } from "@/lib/validation/tenants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function loadTenantAndBilling(id: string) {
  const db = await getDb();
  const rows = await db
    .select({ tenant: tenants, billing: billingStatus })
    .from(tenants)
    .leftJoin(billingStatus, eq(billingStatus.tenantId, tenants.id))
    .where(eq(tenants.id, id))
    .limit(1);
  const row = rows[0];
  if (!row || row.tenant.status === "deleted") throw notFound("Revenda não encontrada");
  return row;
}

/** Ajusta status/vencimento/valor da assinatura. */
export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:billing:write");
  const { id } = await params;

  const parsed = billingUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const { tenant, billing } = await loadTenantAndBilling(id);
  const db = await getDb();

  const values = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.dueDay !== undefined ? { dueDay: input.dueDay } : {}),
    ...(input.amountCents !== undefined ? { amountCents: input.amountCents } : {}),
    ...(input.currentDueDate !== undefined ? { currentDueDate: input.currentDueDate } : {}),
  };

  if (billing) {
    await db.update(billingStatus).set(values).where(eq(billingStatus.tenantId, id));
  } else {
    await db.insert(billingStatus).values({
      tenantId: id,
      status: input.status ?? "adimplente",
      dueDay: input.dueDay ?? 10,
      amountCents: input.amountCents ?? 0,
      currentDueDate: input.currentDueDate ?? nextDueDate(input.dueDay ?? 10),
    });
  }

  if (input.status && input.status !== billing?.status) {
    await registerBillingEvent({
      tenantId: id,
      type: "status_change",
      statusFrom: billing?.status ?? null,
      statusTo: input.status,
      note: input.note,
      actor: {
        userId: actorFromContext(context)?.userId ?? null,
        email: actorFromContext(context)?.email ?? null,
      },
    });
  } else if (input.note) {
    await registerBillingEvent({
      tenantId: id,
      type: "note",
      note: input.note,
      actor: {
        userId: actorFromContext(context)?.userId ?? null,
        email: actorFromContext(context)?.email ?? null,
      },
    });
  }

  await invalidateTenantCache(tenant);
  await logAuditFor(
    context,
    {
      action: "billing.update",
      entity: "billing_status",
      entityId: id,
      tenantId: id,
      metadata: { ...values, note: input.note },
    },
    request,
  );

  return jsonOk({ id });
});

/** Registra um pagamento e (opcionalmente) devolve a revenda para adimplente. */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:billing:write");
  const { id } = await params;

  const parsed = billingPaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const { tenant, billing } = await loadTenantAndBilling(id);
  const db = await getDb();
  const paidAt = input.paidAt ?? new Date();
  const dueDay = billing?.dueDay ?? 10;

  await db
    .update(billingStatus)
    .set({
      lastPaymentAt: paidAt,
      ...(input.markAsPaid
        ? { status: "adimplente" as const, currentDueDate: nextDueDate(dueDay, paidAt) }
        : {}),
    })
    .where(eq(billingStatus.tenantId, id));

  const actor = actorFromContext(context);
  await registerBillingEvent({
    tenantId: id,
    type: "payment",
    amountCents: input.amountCents,
    referenceMonth: input.referenceMonth,
    statusFrom: billing?.status ?? null,
    statusTo: input.markAsPaid ? "adimplente" : (billing?.status ?? null),
    note: input.note,
    actor: { userId: actor?.userId ?? null, email: actor?.email ?? null },
  });

  await invalidateTenantCache(tenant);
  await logAuditFor(
    context,
    {
      action: "billing.payment",
      entity: "billing_status",
      entityId: id,
      tenantId: id,
      metadata: { amountCents: input.amountCents, referenceMonth: input.referenceMonth },
    },
    request,
  );

  return jsonOk({ id });
});
