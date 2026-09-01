import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { plans } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, conflict, jsonOk, withApi } from "@/lib/http";
import { invalidatePlanCaches } from "@/lib/plans/service";
import { planSchema } from "@/lib/validation/plans";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  await requireApiSuperAdmin("platform:billing:read");
  const db = await getDb();
  const rows = await db.select().from(plans).orderBy(asc(plans.sortOrder), asc(plans.name));
  return jsonOk({ plans: rows });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiSuperAdmin("platform:billing:write");

  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const db = await getDb();
  const existing = await db
    .select({ id: plans.id })
    .from(plans)
    .where(eq(plans.slug, parsed.data.slug))
    .limit(1);
  if (existing[0]) throw conflict("Já existe um plano com este identificador");

  const created = await db.insert(plans).values(parsed.data).returning({ id: plans.id });
  await invalidatePlanCaches();

  await logAuditFor(
    context,
    {
      action: "plan.create",
      entity: "plan",
      entityId: created[0].id,
      metadata: { slug: parsed.data.slug, priceCents: parsed.data.priceCents },
    },
    request,
  );

  return jsonOk({ id: created[0].id });
});
