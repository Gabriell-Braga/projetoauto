import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, users } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { getLead } from "@/lib/services/leads";
import { leadUpdateSchema } from "@/lib/validation/leads";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:write");
  const { id } = await params;

  const parsed = leadUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const existing = await getLead(context.tenant.id, id);
  if (!existing) throw notFound("Lead não encontrado");

  // o responsável precisa ser um usuário da própria revenda
  if (input.assignedToUserId) {
    const owner = await (await getDb())
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, input.assignedToUserId), eq(users.tenantId, context.tenant.id)))
      .limit(1);
    if (!owner[0]) throw badRequest("Responsável inválido");
  }

  const db = await getDb();
  await db
    .update(leads)
    .set(input)
    .where(and(eq(leads.tenantId, context.tenant.id), eq(leads.id, id)));

  await logAuditFor(
    context,
    { action: "lead.update", entity: "lead", entityId: id, metadata: input },
    request,
  );

  return jsonOk({ id });
});
