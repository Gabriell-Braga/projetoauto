import { getDb } from "@/db";
import { eq } from "drizzle-orm";
import { whatsappConnections } from "@/db/schema";
import { verifySignature } from "@/lib/integrations/whatsapp-client";
import { parseInboundMessages } from "@/lib/integrations/whatsapp-rules";
import {
  connectionByPhoneNumberId,
  readWhatsappCredentials,
  receiveInbound,
} from "@/lib/services/whatsapp";

export const dynamic = "force-dynamic";

/**
 * Verificação do webhook, feita uma vez pela Meta ao cadastrar a URL.
 *
 * Ela manda um desafio e espera o mesmo valor de volta, em texto puro. O token
 * é escolhido pela revenda na hora de conectar e guardado no cofre — comparar
 * contra ele é o que impede qualquer um de registrar nosso endereço no
 * WhatsApp Business de outra pessoa.
 */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const mode = query.get("hub.mode");
  const token = query.get("hub.verify_token");
  const challenge = query.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    return new Response("parâmetros ausentes", { status: 400 });
  }

  const db = await getDb();
  const connections = await db.select().from(whatsappConnections);

  for (const connection of connections) {
    try {
      const credentials = await readWhatsappCredentials(connection);
      if (credentials.verifyToken && credentials.verifyToken === token) {
        return new Response(challenge, {
          headers: { "content-type": "text/plain" },
        });
      }
    } catch {
      // credencial ilegível não pode derrubar a verificação das outras
    }
  }

  return new Response("token inválido", { status: 403 });
}

/**
 * Mensagens recebidas.
 *
 * O corpo é lido CRU para conferir a assinatura: reserializar o JSON muda
 * espaços e ordem, e derrubaria mensagens legítimas.
 *
 * Depois de autenticado, responde 200 sempre. A Meta reenvia o que não recebe
 * 200 e desativa o webhook após falhas seguidas — uma mensagem que a gente não
 * conseguiu gravar não pode custar o canal inteiro. A idempotência por id da
 * mensagem cuida do reenvio.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ received: true, ignored: "corpo ilegível" });
  }

  const messages = parseInboundMessages(payload);
  if (messages.length === 0) {
    // status de entrega e leitura chegam por aqui: aceitar e seguir
    return Response.json({ received: true });
  }

  const connection = await connectionByPhoneNumberId(messages[0].phoneNumberId);
  if (!connection) {
    console.warn("[whatsapp] entrega para número desconhecido", messages[0].phoneNumberId);
    return Response.json({ received: true, ignored: "número não conectado" });
  }

  let credentials;
  try {
    credentials = await readWhatsappCredentials(connection);
  } catch (error) {
    console.error("[whatsapp] não consegui abrir as credenciais", error);
    return Response.json({ received: true, deferred: true });
  }

  if (!(await verifySignature(raw, signature, credentials.appSecret))) {
    console.warn("[whatsapp] assinatura inválida para", connection.tenantId);
    return new Response("assinatura inválida", { status: 401 });
  }

  for (const message of messages) {
    try {
      await receiveInbound(connection.tenantId, message);
    } catch (error) {
      console.error("[whatsapp] falha ao registrar mensagem", message.externalId, error);
      await recordFailure(connection.tenantId, error);
    }
  }

  return Response.json({ received: true, count: messages.length });
}

async function recordFailure(tenantId: string, error: unknown) {
  try {
    const db = await getDb();
    await db
      .update(whatsappConnections)
      .set({ lastError: error instanceof Error ? error.message : String(error) })
      .where(eq(whatsappConnections.tenantId, tenantId));
  } catch {
    // registrar a falha não pode gerar outra
  }
}
