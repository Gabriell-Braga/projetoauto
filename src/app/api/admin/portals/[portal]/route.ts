import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { connectPortal, disconnectPortal } from "@/lib/services/portals";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ portal: string }> };

const schema = z.object({
  credentials: z.record(z.string(), z.string().max(500)),
});

export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("tenant:settings");
  await requireFeature(context.tenant.id, "integracao_classificados");
  const { portal } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await connectPortal(context.tenant.id, context.user.id, portal, parsed.data.credentials);

  // o metadata NUNCA leva as credenciais: auditoria é lida por gente
  await logAuditFor(
    context,
    { action: "portal.connect", entity: "portal_connection", entityId: portal },
    request,
  );
  return jsonOk({ portal, status: "conectado" });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("tenant:settings");
  await requireFeature(context.tenant.id, "integracao_classificados");
  const { portal } = await params;

  await disconnectPortal(context.tenant.id, portal);
  await logAuditFor(
    context,
    { action: "portal.disconnect", entity: "portal_connection", entityId: portal },
    request,
  );
  return jsonOk({ portal, status: "desconectado" });
});
