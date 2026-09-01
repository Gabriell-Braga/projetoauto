import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createTenantWebhook, listTenantWebhooks } from "@/lib/services/api-access";
import { tenantWebhookSchema } from "@/lib/validation/crm";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const context = await requireApiTenant("api:manage");
  await requireFeature(context.tenant.id, "api_webhooks");

  const hooks = await listTenantWebhooks(context.tenant.id);
  // o segredo assina as chamadas; devolvê-lo na listagem o espalharia por logs
  // e histórico do navegador sem necessidade
  return jsonOk({
    webhooks: hooks.map((hook) => ({
      id: hook.id,
      url: hook.url,
      events: hook.events ?? [],
      active: hook.active,
      lastStatus: hook.lastStatus,
      lastError: hook.lastError,
      lastAttemptAt: hook.lastAttemptAt,
      failureCount: hook.failureCount,
    })),
  });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("api:manage");
  await requireFeature(context.tenant.id, "api_webhooks");

  const parsed = tenantWebhookSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const created = await createTenantWebhook(context.tenant.id, {
    url: parsed.data.url,
    events: parsed.data.events,
  });

  await logAuditFor(
    context,
    { action: "webhook.create", entity: "tenant_webhook", entityId: created.id, metadata: { url: parsed.data.url } },
    request,
  );

  // única vez que o segredo aparece — quem integra precisa dele para conferir
  // a assinatura das chamadas que vamos fazer
  return jsonOk(created);
});
