import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { apiKeys, tenantWebhooks, type ApiKey, type TenantWebhook } from "@/db/schema";

const KEY_PREFIX = "pa_";
const PREFIX_LENGTH = 12;

/* ------------------------------------------------------------------------ */
/* Chaves de API                                                             */
/* ------------------------------------------------------------------------ */

/**
 * Hash da chave com SHA-256, não com PBKDF2.
 *
 * A escolha é oposta à das senhas, e de propósito: a chave é gerada por nós
 * com 256 bits de aleatoriedade, então não há dicionário a percorrer e o
 * endurecimento não compra nada. Já a lentidão custaria — isto roda a cada
 * chamada de API, enquanto senha roda uma vez por login.
 */
export async function hashApiKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function generateApiKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const body = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${KEY_PREFIX}${body}`;
}

export async function listApiKeys(tenantId: string): Promise<ApiKey[]> {
  const db = await getDb();
  return db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.tenantId, tenantId))
    .orderBy(desc(apiKeys.createdAt));
}

/** Devolve a chave em claro uma única vez — depois só resta o hash. */
export async function createApiKey(
  tenantId: string,
  userId: string | null,
  name: string,
): Promise<{ id: string; key: string }> {
  const db = await getDb();
  const key = generateApiKey();

  const created = await db
    .insert(apiKeys)
    .values({
      tenantId,
      name,
      prefix: key.slice(0, PREFIX_LENGTH),
      keyHash: await hashApiKey(key),
      createdByUserId: userId,
    })
    .returning({ id: apiKeys.id });

  return { id: created[0].id, key };
}

/**
 * Revoga em vez de excluir.
 *
 * A linha registra quem criou e quando foi usada pela última vez. Apagar
 * levaria junto o rastro de uma credencial que talvez tenha vazado — que é
 * exatamente quando alguém vai querer olhar.
 */
export async function revokeApiKey(tenantId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const updated = await db
    .update(apiKeys)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiKeys.tenantId, tenantId), eq(apiKeys.id, id), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });
  return Boolean(updated[0]);
}

/** Resolve a revenda dona da chave. Chave revogada não autentica. */
export async function authenticateApiKey(key: string): Promise<{ tenantId: string } | null> {
  if (!key.startsWith(KEY_PREFIX)) return null;

  const db = await getDb();
  const rows = await db
    .select({ id: apiKeys.id, tenantId: apiKeys.tenantId, revokedAt: apiKeys.revokedAt })
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, await hashApiKey(key)))
    .limit(1);

  const found = rows[0];
  if (!found || found.revokedAt) return null;

  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, found.id));
  return { tenantId: found.tenantId };
}

/* ------------------------------------------------------------------------ */
/* Webhooks de saída                                                         */
/* ------------------------------------------------------------------------ */

export async function listTenantWebhooks(tenantId: string): Promise<TenantWebhook[]> {
  const db = await getDb();
  return db
    .select()
    .from(tenantWebhooks)
    .where(eq(tenantWebhooks.tenantId, tenantId))
    .orderBy(desc(tenantWebhooks.createdAt));
}

export function generateWebhookSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createTenantWebhook(
  tenantId: string,
  input: { url: string; events: string[] },
): Promise<{ id: string; secret: string }> {
  const db = await getDb();
  const secret = generateWebhookSecret();
  const created = await db
    .insert(tenantWebhooks)
    .values({ tenantId, url: input.url, secret, events: input.events })
    .returning({ id: tenantWebhooks.id });
  return { id: created[0].id, secret };
}

export async function updateTenantWebhook(
  tenantId: string,
  id: string,
  input: { url?: string; events?: string[]; active?: boolean },
): Promise<boolean> {
  const db = await getDb();
  const updated = await db
    .update(tenantWebhooks)
    .set(input)
    .where(and(eq(tenantWebhooks.tenantId, tenantId), eq(tenantWebhooks.id, id)))
    .returning({ id: tenantWebhooks.id });
  return Boolean(updated[0]);
}

export async function deleteTenantWebhook(tenantId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(tenantWebhooks)
    .where(and(eq(tenantWebhooks.tenantId, tenantId), eq(tenantWebhooks.id, id)))
    .returning({ id: tenantWebhooks.id });
  return Boolean(deleted[0]);
}

/** Assinatura HMAC-SHA256 do corpo, para quem recebe provar a origem. */
export async function signPayload(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Dispara o evento para os webhooks que o assinam.
 *
 * Nunca lança: notificar terceiro não pode derrubar a ação que gerou o evento.
 * Um lead perdido porque o servidor do cliente estava fora seria um estrago
 * muito maior do que o aviso não entregue.
 */
export async function dispatchTenantEvent(
  tenantId: string,
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const hooks = (await listTenantWebhooks(tenantId)).filter(
      (hook) => hook.active && (hook.events ?? []).includes(event),
    );
    if (hooks.length === 0) return;

    const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data });
    const db = await getDb();

    await Promise.all(
      hooks.map(async (hook) => {
        try {
          const response = await fetch(hook.url, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "user-agent": "ProjetoAuto-Webhook",
              "x-projetoauto-event": event,
              "x-projetoauto-signature": await signPayload(hook.secret, body),
            },
            body,
            signal: AbortSignal.timeout(8000),
          });

          await db
            .update(tenantWebhooks)
            .set({
              lastStatus: response.status,
              lastAttemptAt: new Date(),
              lastError: response.ok ? null : `HTTP ${response.status}`,
              failureCount: response.ok ? 0 : hook.failureCount + 1,
            })
            .where(eq(tenantWebhooks.id, hook.id));
        } catch (error) {
          await db
            .update(tenantWebhooks)
            .set({
              lastStatus: null,
              lastAttemptAt: new Date(),
              lastError: error instanceof Error ? error.message : String(error),
              failureCount: hook.failureCount + 1,
            })
            .where(eq(tenantWebhooks.id, hook.id));
        }
      }),
    );
  } catch (error) {
    console.error("[webhook] falha ao despachar", event, error);
  }
}
