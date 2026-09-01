import { eq, and, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { plans, tenants } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, conflict, jsonOk, notFound, withApi } from "@/lib/http";
import { invalidatePlanCaches } from "@/lib/plans/service";
import { planUpdateSchema } from "@/lib/validation/plans";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Revendas que usam o plano — precisam ter as permissões recalculadas. */
async function tenantsOnPlan(planId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.planId, planId));
  return rows.map((row) => row.id);
}

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:billing:write");
  const { id } = await params;

  const parsed = planUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const db = await getDb();
  const current = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  if (!current[0]) throw notFound("Plano não encontrado");

  if (parsed.data.slug && parsed.data.slug !== current[0].slug) {
    const clash = await db
      .select({ id: plans.id })
      .from(plans)
      .where(and(eq(plans.slug, parsed.data.slug), ne(plans.id, id)))
      .limit(1);
    if (clash[0]) throw conflict("Já existe um plano com este identificador");
  }

  const affected = await tenantsOnPlan(id);

  // desativar um plano em uso deixaria as revendas sem permissões definidas
  if (parsed.data.active === false && affected.length > 0) {
    throw conflict(
      `${affected.length} revenda(s) usam este plano. Mova-as antes de desativar.`,
    );
  }

  await db.update(plans).set(parsed.data).where(eq(plans.id, id));
  await invalidatePlanCaches(affected);

  await logAuditFor(
    context,
    { action: "plan.update", entity: "plan", entityId: id, metadata: { fields: Object.keys(parsed.data) } },
    request,
  );

  return jsonOk({ id, tenantsAffected: affected.length });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:billing:write");
  const { id } = await params;

  const db = await getDb();
  const current = await db.select({ slug: plans.slug }).from(plans).where(eq(plans.id, id)).limit(1);
  if (!current[0]) throw notFound("Plano não encontrado");

  const affected = await tenantsOnPlan(id);
  if (affected.length > 0) {
    throw conflict(
      `${affected.length} revenda(s) usam este plano. Mova-as para outro antes de excluir.`,
    );
  }

  await db.delete(plans).where(eq(plans.id, id));
  await invalidatePlanCaches();

  await logAuditFor(
    context,
    { action: "plan.delete", entity: "plan", entityId: id, metadata: { slug: current[0].slug } },
    request,
  );

  return jsonOk({ deleted: true });
});
