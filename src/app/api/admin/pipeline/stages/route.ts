import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createStage, ensureStages, reorderStages } from "@/lib/services/crm";
import { stageOrderSchema, stageSchema } from "@/lib/validation/crm";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const context = await requireApiTenant("leads:read");
  await requireFeature(context.tenant.id, "funil_comercial");
  return jsonOk({ stages: await ensureStages(context.tenant.id) });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "funil_comercial");

  const parsed = stageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const id = await createStage(context.tenant.id, parsed.data);
  await logAuditFor(
    context,
    { action: "stage.create", entity: "pipeline_stage", entityId: id, metadata: parsed.data },
    request,
  );
  return jsonOk({ id });
});

/** Reordenar é a operação mais usada do funil, então ganhou verbo próprio. */
export const PUT = withApi(async (request: Request) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "funil_comercial");

  const parsed = stageOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await reorderStages(context.tenant.id, parsed.data.stageIds);
  return jsonOk({ reordered: true });
});
