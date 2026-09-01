import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createTemplate, ensureTemplates } from "@/lib/services/message-templates";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2, "Dê um nome ao modelo").max(60),
  body: z.string().trim().min(5, "Escreva a mensagem").max(2000),
});

export const GET = withApi(async () => {
  const context = await requireApiTenant("leads:read");
  return jsonOk({ templates: await ensureTemplates(context.tenant.id) });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("tenant:settings");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const id = await createTemplate(context.tenant.id, parsed.data);
  await logAuditFor(
    context,
    { action: "template.create", entity: "message_template", entityId: id },
    request,
  );
  return jsonOk({ id });
});
