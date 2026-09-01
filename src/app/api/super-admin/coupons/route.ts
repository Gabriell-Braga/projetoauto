import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { coupons } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, conflict, jsonOk, withApi } from "@/lib/http";
import { couponSchema } from "@/lib/validation/plans";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  await requireApiSuperAdmin("platform:billing:read");
  const db = await getDb();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return jsonOk({ coupons: rows });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiSuperAdmin("platform:billing:write");

  const parsed = couponSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const db = await getDb();
  const existing = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.code, input.code))
    .limit(1);
  if (existing[0]) throw conflict("Já existe um cupom com este código");

  const created = await db
    .insert(coupons)
    .values({
      ...input,
      planIds: input.planIds ?? [],
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({ id: coupons.id });

  await logAuditFor(
    context,
    { action: "coupon.create", entity: "coupon", entityId: created[0].id, metadata: { code: input.code } },
    request,
  );

  return jsonOk({ id: created[0].id });
});
