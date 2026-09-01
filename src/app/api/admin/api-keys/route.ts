import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createApiKey, listApiKeys } from "@/lib/services/api-access";
import { apiKeySchema } from "@/lib/validation/crm";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const context = await requireApiTenant("api:manage");
  await requireFeature(context.tenant.id, "api_webhooks");

  const keys = await listApiKeys(context.tenant.id);
  // nunca devolvemos o hash: ele não serve para a tela e vaza material de ataque
  return jsonOk({
    keys: keys.map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      lastUsedAt: key.lastUsedAt,
      revokedAt: key.revokedAt,
      createdAt: key.createdAt,
    })),
  });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("api:manage");
  await requireFeature(context.tenant.id, "api_webhooks");

  const parsed = apiKeySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const created = await createApiKey(context.tenant.id, context.user.id, parsed.data.name);
  await logAuditFor(
    context,
    { action: "api_key.create", entity: "api_key", entityId: created.id, metadata: { name: parsed.data.name } },
    request,
  );

  // única vez que a chave em claro sai daqui
  return jsonOk(created);
});
