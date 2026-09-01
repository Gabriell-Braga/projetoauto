import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenants, webhookEvents } from "@/db/schema";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { asaasEnvironment, isGatewayConfigured, listWebhooks } from "@/lib/gateway/asaas";
import { lastDeliveries } from "@/lib/gateway/delivery-log";
import { jsonOk, withApi } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Saúde da integração, para o painel responder sozinho a "o gateway avisou?".
 *
 * Sem isto, "o Asaas nunca chamou" e "o Asaas chamou e nós recusamos" produzem
 * exatamente a mesma tela — nenhum evento registrado — e as duas causas têm
 * conserto completamente diferente.
 */
export const GET = withApi(async () => {
  await requireApiSuperAdmin("platform:billing:read");

  if (!isGatewayConfigured()) {
    return jsonOk({
      configured: false,
      diagnostico: "Nenhuma chave do gateway configurada nas variáveis secretas.",
    });
  }

  const db = await getDb();

  const [events, deliveries, webhooks] = await Promise.all([
    db
      .select({
        id: webhookEvents.id,
        eventType: webhookEvents.eventType,
        receivedAt: webhookEvents.receivedAt,
        error: webhookEvents.error,
        tenantName: tenants.name,
      })
      .from(webhookEvents)
      .leftJoin(tenants, eq(tenants.id, webhookEvents.tenantId))
      .orderBy(desc(webhookEvents.receivedAt))
      .limit(10),
    lastDeliveries(),
    listWebhooks().catch((error: unknown) => ({
      data: [],
      error: error instanceof Error ? error.message : String(error),
    })),
  ]);

  const registered = "error" in webhooks ? [] : webhooks.data;
  const ours = registered.find((hook) => hook.url?.includes("/api/webhooks/asaas"));

  return jsonOk({
    configured: true,
    environment: asaasEnvironment(),
    webhook: ours
      ? { url: ours.url, enabled: ours.enabled, name: ours.name }
      : null,
    connectionError: "error" in webhooks ? webhooks.error : null,
    lastAccepted: deliveries.accepted,
    lastRejected: deliveries.rejected,
    events: events.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      receivedAt: event.receivedAt?.toISOString() ?? null,
      error: event.error,
      tenantName: event.tenantName,
    })),
    diagnostico: diagnose({
      hasWebhook: Boolean(ours),
      enabled: ours?.enabled ?? false,
      eventCount: events.length,
      rejectedAfterAccepted: isRejectionMoreRecent(deliveries),
      neverDelivered: !deliveries.accepted && !deliveries.rejected,
    }),
  });
});

function isRejectionMoreRecent(deliveries: Awaited<ReturnType<typeof lastDeliveries>>): boolean {
  if (!deliveries.rejected) return false;
  if (!deliveries.accepted) return true;
  return deliveries.rejected.at > deliveries.accepted.at;
}

function diagnose(state: {
  hasWebhook: boolean;
  enabled: boolean;
  eventCount: number;
  rejectedAfterAccepted: boolean;
  neverDelivered: boolean;
}): string {
  if (!state.hasWebhook) {
    return "Nenhum webhook do Asaas aponta para cá. Cadastre a URL no painel do gateway.";
  }
  if (!state.enabled) {
    return "O webhook existe mas está desligado no Asaas. Uma resposta diferente de 200 interrompe a fila até religarem na mão.";
  }
  if (state.rejectedAfterAccepted) {
    return "A última entrega foi RECUSADA por token. O que está no campo de token no painel do Asaas não confere com ASAAS_WEBHOOK_TOKEN aqui — e a fila do gateway fica parada até isso bater.";
  }
  if (state.neverDelivered) {
    return "O webhook está cadastrado e ativo, mas nenhuma entrega chegou até agora. Pode ser fila do gateway ainda em trânsito.";
  }
  if (state.eventCount === 0) {
    return "Entregas chegaram e foram aceitas, mas nenhuma virou evento — provavelmente eventos que não mapeamos.";
  }
  return "Webhook ativo e recebendo eventos.";
}
