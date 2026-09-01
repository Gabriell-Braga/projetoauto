import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { deleteStage, updateStage } from "@/lib/services/crm";
import { stageUpdateSchema } from "@/lib/validation/crm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "funil_comercial");
  const { id } = await params;

  const parsed = stageUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await updateStage(context.tenant.id, id, parsed.data);
  await logAuditFor(context, { action: "stage.update", entity: "pipeline_stage", entityId: id }, request);
  return jsonOk({ id });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "funil_comercial");
  const { id } = await params;

  await deleteStage(context.tenant.id, id);
  await logAuditFor(context, { action: "stage.delete", entity: "pipeline_stage", entityId: id }, request);
  return jsonOk({ deleted: true });
});
