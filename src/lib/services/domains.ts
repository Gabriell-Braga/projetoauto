import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantDomains, type TenantDomain } from "@/db/schema";
import { ApiError } from "@/lib/http";
import { domainVerdict, normalizeDomain } from "@/lib/integrations/domains";
import * as vercel from "@/lib/integrations/vercel";

export async function listDomains(tenantId: string): Promise<TenantDomain[]> {
  const db = await getDb();
  return db.select().from(tenantDomains).where(eq(tenantDomains.tenantId, tenantId));
}

export async function getDomain(tenantId: string, id: string): Promise<TenantDomain | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(tenantDomains)
    .where(and(eq(tenantDomains.tenantId, tenantId), eq(tenantDomains.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Cadastra o domínio aqui e na hospedagem, nesta ordem.
 *
 * A hospedagem vem primeiro de propósito: se a Vercel recusar — domínio de
 * outra conta, endereço inválido — não sobra linha órfã no nosso banco
 * prometendo um site que nunca vai subir. O caminho contrário deixaria a tela
 * mostrando "pendente" para sempre, sem nada do outro lado esperando.
 */
export async function addDomain(
  tenantId: string,
  userId: string | null,
  input: string,
): Promise<string> {
  const parsed = normalizeDomain(input);
  if (!parsed.ok) throw new ApiError(400, parsed.reason);
  const domain = parsed.domain;

  const db = await getDb();
  const existing = await db
    .select({ id: tenantDomains.id, tenantId: tenantDomains.tenantId })
    .from(tenantDomains)
    .where(eq(tenantDomains.domain, domain))
    .limit(1);

  if (existing[0]) {
    // a mensagem não diz de quem é: quem cadastra não precisa saber que outra
    // revenda existe, e dizer isso entregaria a carteira de clientes
    throw new ApiError(
      400,
      existing[0].tenantId === tenantId
        ? "Este endereço já está cadastrado."
        : "Este endereço já está em uso.",
    );
  }

  await vercel.addDomain(domain);

  const isFirst = (await listDomains(tenantId)).length === 0;
  const created = await db
    .insert(tenantDomains)
    .values({
      tenantId,
      domain,
      createdByUserId: userId,
      // o primeiro vira o oficial sozinho: obrigar a escolher quando só existe
      // um é pergunta sem resposta possível
      isPrimary: isFirst,
    })
    .returning({ id: tenantDomains.id });

  return created[0].id;
}

/**
 * Pergunta à hospedagem como está o domínio e grava o que voltou.
 *
 * Chamada pela tela, no botão de conferir. Não há rotina de fundo: DNS demora
 * de minutos a horas e quem está esperando é a pessoa olhando a tela — ela
 * confere quando mexeu no DNS, que é exatamente a hora certa.
 */
export async function refreshDomain(tenantId: string, id: string): Promise<TenantDomain | null> {
  const current = await getDomain(tenantId, id);
  if (!current) return null;

  const db = await getDb();

  try {
    // pede a conferência do TXT antes de ler o estado, senão a resposta é
    // sempre a de antes da última mudança de DNS
    await vercel.verifyDomain(current.domain).catch(() => undefined);
    const state = await vercel.domainState(current.domain);
    const verdict = domainVerdict(current.domain, state);

    await db
      .update(tenantDomains)
      .set({
        status: verdict.status,
        pendingRecords: verdict.pendingRecords,
        lastError: null,
        lastCheckedAt: new Date(),
      })
      .where(eq(tenantDomains.id, id));
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Falha ao consultar a hospedagem.";
    await db
      .update(tenantDomains)
      .set({ status: "erro", lastError: message, lastCheckedAt: new Date() })
      .where(eq(tenantDomains.id, id));
  }

  return getDomain(tenantId, id);
}

/**
 * Elege o endereço oficial do site.
 *
 * Só um por revenda, então eleger um rebaixa o anterior na mesma operação —
 * dois oficiais fariam o canonical do SEO variar entre as páginas.
 */
export async function setPrimaryDomain(tenantId: string, id: string): Promise<boolean> {
  const current = await getDomain(tenantId, id);
  if (!current) return false;

  if (current.status !== "ativo") {
    throw new ApiError(
      400,
      "Só dá para tornar oficial um endereço que já está no ar. Confira o DNS primeiro.",
    );
  }

  const db = await getDb();
  await db
    .update(tenantDomains)
    .set({ isPrimary: false })
    .where(eq(tenantDomains.tenantId, tenantId));
  await db.update(tenantDomains).set({ isPrimary: true }).where(eq(tenantDomains.id, id));
  return true;
}

/**
 * Tira o domínio da hospedagem e daqui.
 *
 * Se a Vercel falhar, a linha continua: apagar aqui e deixar lá criaria um
 * domínio fantasma servindo o site sem nada no painel apontando para ele — e
 * ninguém descobriria até o cliente reclamar.
 */
export async function removeDomain(tenantId: string, id: string): Promise<boolean> {
  const current = await getDomain(tenantId, id);
  if (!current) return false;

  await vercel.removeDomain(current.domain);

  const db = await getDb();
  await db.delete(tenantDomains).where(eq(tenantDomains.id, id));

  // o site não pode ficar sem endereço oficial enquanto sobrar algum
  if (current.isPrimary) {
    const rest = await listDomains(tenantId);
    const next = rest.find((row) => row.status === "ativo") ?? rest[0];
    if (next) {
      await db.update(tenantDomains).set({ isPrimary: true }).where(eq(tenantDomains.id, next.id));
    }
  }

  return true;
}
