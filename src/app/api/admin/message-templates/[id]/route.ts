import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { deleteTemplate, updateTemplate } from "@/lib/services/message-templates";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  body: z.string().trim().min(5).max(2000).optional(),
  active: z.boolean().optional(),
});

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("tenant:settings");
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const ok = await updateTemplate(context.tenant.id, id, parsed.data);
  if (!ok) throw notFound("Modelo não encontrado");

  await logAuditFor(
    context,
    { action: "template.update", entity: "message_template", entityId: id },
    request,
  );
  return jsonOk({ id });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("tenant:settings");
  const { id } = await params;

  const ok = await deleteTemplate(context.tenant.id, id);
  if (!ok) throw notFound("Modelo não encontrado");

  await logAuditFor(
    context,
    { action: "template.delete", entity: "message_template", entityId: id },
    request,
  );
  return jsonOk({ deleted: true });
});
