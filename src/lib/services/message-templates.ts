import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messageTemplates, type MessageTemplate } from "@/db/schema";
import { DEFAULT_TEMPLATES } from "@/lib/integrations/message-templates";

export async function listTemplates(tenantId: string): Promise<MessageTemplate[]> {
  const db = await getDb();
  return db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.tenantId, tenantId))
    .orderBy(asc(messageTemplates.sortOrder), asc(messageTemplates.name));
}

/**
 * Cria os modelos iniciais na primeira visita.
 *
 * Tela vazia obriga a pessoa a escrever quatro mensagens antes de conseguir
 * usar o recurso, e ninguém faz isso no meio de um atendimento.
 */
export async function ensureTemplates(tenantId: string): Promise<MessageTemplate[]> {
  const existing = await listTemplates(tenantId);
  if (existing.length > 0) return existing;

  const db = await getDb();
  await db.insert(messageTemplates).values(
    DEFAULT_TEMPLATES.map((template, index) => ({
      tenantId,
      name: template.name,
      body: template.body,
      channel: "whatsapp" as const,
      sortOrder: index,
    })),
  );
  return listTemplates(tenantId);
}

export async function createTemplate(
  tenantId: string,
  input: { name: string; body: string },
): Promise<string> {
  const db = await getDb();
  const existing = await listTemplates(tenantId);
  const created = await db
    .insert(messageTemplates)
    .values({ tenantId, ...input, sortOrder: existing.length })
    .returning({ id: messageTemplates.id });
  return created[0].id;
}

export async function updateTemplate(
  tenantId: string,
  id: string,
  input: { name?: string; body?: string; active?: boolean },
): Promise<boolean> {
  const db = await getDb();
  const updated = await db
    .update(messageTemplates)
    .set(input)
    .where(and(eq(messageTemplates.tenantId, tenantId), eq(messageTemplates.id, id)))
    .returning({ id: messageTemplates.id });
  return Boolean(updated[0]);
}

export async function deleteTemplate(tenantId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db
    .delete(messageTemplates)
    .where(and(eq(messageTemplates.tenantId, tenantId), eq(messageTemplates.id, id)))
    .returning({ id: messageTemplates.id });
  return Boolean(deleted[0]);
}
