import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { jsonOk, notFound, withApi } from "@/lib/http";
import { revokeApiKey } from "@/lib/services/api-access";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("api:manage");
  await requireFeature(context.tenant.id, "api_webhooks");
  const { id } = await params;

  const ok = await revokeApiKey(context.tenant.id, id);
  if (!ok) throw notFound("Chave não encontrada ou já revogada");

  await logAuditFor(context, { action: "api_key.revoke", entity: "api_key", entityId: id }, request);
  return jsonOk({ revoked: true });
});
