import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { portalConnections, webhookEvents } from "@/db/schema";
import { clientIp } from "@/lib/http";
import { parseNotification } from "@/lib/integrations/mercadolivre";

export const dynamic = "force-dynamic";

/**
 * Notificações do Mercado Livre.
 *
 * É esta URL que se cadastra no app do ML, em "URL de retornos de chamada de
 * notificação": https://<host>/app/api/webhooks/mercadolivre
 *
 * Duas coisas mandam aqui:
 *
 * 1. O ML não assina o aviso. O que dá para conferir é o `application_id`,
 *    que precisa ser o do nosso app — aviso de outro app é recusado.
 *
 * 2. Ele espera 200 em até 500 ms e reenvia o que falha; depois de muitas
 *    falhas, desliga as notificações do app. Então o handler só guarda e
 *    responde. Quem busca o recurso que mudou é a sincronização, depois.
 */
export async function POST(request: Request) {
  const appId = process.env.MERCADOLIVRE_CLIENT_ID;
  if (!appId) {
    console.error("[mercadolivre] MERCADOLIVRE_CLIENT_ID não configurado");
    return new Response("unauthorized", { status: 401 });
  }

  const notification = parseNotification(await request.json().catch(() => null));
  if (!notification) {
    // corpo que não é do ML: aceitar e ignorar, para não contar como falha
    return Response.json({ received: true, ignored: "payload não reconhecido" });
  }
  if (notification.applicationId !== appId) {
    console.warn("[mercadolivre] aviso de outro app, de", clientIp(request));
    return new Response("unauthorized", { status: 401 });
  }

  const db = await getDb();

  // a conta do ML fica em settings (não é segredo) justamente para achar a
  // revenda aqui sem abrir o cofre de cada conexão
  const connections = await db
    .select({ tenantId: portalConnections.tenantId, settings: portalConnections.settings })
    .from(portalConnections)
    .where(
      and(eq(portalConnections.portal, "mercadolivre"), eq(portalConnections.status, "conectado")),
    );
  const owner = connections.find(
    (connection) => connection.settings?.externalUserId === notification.externalUserId,
  );

  await db
    .insert(webhookEvents)
    .values({
      id: `mercadolivre:${notification.id}`,
      provider: "mercadolivre",
      eventType: notification.topic,
      tenantId: owner?.tenantId ?? null,
      payload: { resource: notification.resource, externalUserId: notification.externalUserId },
      // sem revenda dona não há o que processar: conta desconectada ou de outro app
      ...(owner ? {} : { processedAt: new Date(), error: "conta sem revenda conectada" }),
    })
    .onConflictDoNothing();

  return Response.json({ received: true, tenant: Boolean(owner) });
}
