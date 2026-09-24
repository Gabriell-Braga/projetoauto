import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  leadEvents,
  leads,
  vehiclePublications,
  vehicles,
  webhookEvents,
  type WebhookEvent,
} from "@/db/schema";
import {
  buyerName,
  parseQuestion,
  type MercadoLivreClient,
  type MlQuestion,
} from "@/lib/integrations/mercadolivre";
import { dispatchTenantEvent } from "@/lib/services/api-access";
import { listStages, pickAssignee, recordLeadEvent } from "@/lib/services/crm";

/**
 * A volta da integração com os portais: quem pergunta no anúncio vira lead.
 *
 * A ida (carro daqui → anúncio no portal) é o `portal-sync`. Sem esta metade,
 * a revenda publica pelo painel e continua atendendo dentro do Mercado Livre,
 * com o funil, o rodízio de vendedor e o relatório cegos para tudo que o
 * portal traz — que costuma ser a maior fonte de contato de uma loja.
 *
 * O que o Mercado Livre entrega em uma pergunta é o texto, o anúncio e o
 * APELIDO de quem perguntou. Telefone e e-mail não existem nessa etapa: a
 * conversa acontece lá até a pessoa passar o contato. Por isso o lead nasce
 * sem telefone, com o link do anúncio para responder de lá, e a resposta
 * segue sendo dada no portal — inventar um "telefone" aqui só encheria o CRM
 * de contato que não liga.
 *
 * Roda dentro da sincronização dos portais (mesmo botão, mesmo agendador),
 * porque no Webflow Cloud não há trabalho de fundo: quem conduz é o chamador.
 */

/** Quantas notificações processar por passada. */
const BATCH = 25;

export type LeadIngestReport = {
  /** Leads novos criados a partir de perguntas. */
  created: number;
  /** Perguntas que entraram num lead que já existia. */
  appended: number;
  /** Notificações que não deram em lead (tópico que não usamos, anúncio de outro). */
  ignored: number;
  failed: number;
};

/**
 * Só `/questions/<número>` é aceito.
 *
 * O caminho vem de fora, e é ele que monta a chamada à API com o token da
 * revenda. Validar aqui é o que impede um aviso forjado de nos fazer buscar
 * um recurso qualquer da conta dela.
 */
export function questionResource(resource: string): string | null {
  return /^\/questions\/\d+$/.test(resource) ? resource : null;
}

/** Rótulo curto do veículo, o mesmo formato usado no lead do site. */
function vehicleLabelOf(vehicle: {
  brand: string;
  model: string;
  version: string | null;
  yearModel: number;
}): string {
  return [vehicle.brand, vehicle.model, vehicle.version, vehicle.yearModel]
    .filter(Boolean)
    .join(" ");
}

/**
 * Identidade do lead na origem: um lead por comprador por anúncio.
 *
 * A mesma pessoa costuma perguntar duas, três vezes no mesmo carro ("tem
 * troca?", "aceita financiamento?"). Cada pergunta virando um lead novo daria
 * à revenda três fichas do mesmo negócio para atender.
 */
export function mercadoLivreLeadKey(question: MlQuestion): string {
  return `mercadolivre:${question.itemId}:${question.fromUserId}`;
}

export async function ingestMercadoLivreLeads(
  tenantId: string,
  client: MercadoLivreClient,
): Promise<LeadIngestReport> {
  const report: LeadIngestReport = { created: 0, appended: 0, ignored: 0, failed: 0 };
  const db = await getDb();

  const pending = await db
    .select()
    .from(webhookEvents)
    .where(
      and(
        eq(webhookEvents.provider, "mercadolivre"),
        eq(webhookEvents.tenantId, tenantId),
        isNull(webhookEvents.processedAt),
      ),
    )
    .orderBy(asc(webhookEvents.receivedAt))
    .limit(BATCH);

  for (const event of pending) {
    try {
      const outcome = await processNotification(tenantId, client, event);
      report[outcome] += 1;
      await db
        .update(webhookEvents)
        .set({ processedAt: new Date(), error: null })
        .where(eq(webhookEvents.id, event.id));
    } catch (error) {
      report.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      /*
       * Fica com erro e SEM processedAt de propósito: a próxima passada tenta
       * de novo. Token vencido e instabilidade do ML são o caso comum aqui, e
       * os dois passam sozinhos — marcar como processado perderia o lead.
       */
      await db
        .update(webhookEvents)
        .set({ error: message })
        .where(eq(webhookEvents.id, event.id));
    }
  }

  return report;
}

type Outcome = "created" | "appended" | "ignored";

async function processNotification(
  tenantId: string,
  client: MercadoLivreClient,
  event: WebhookEvent,
): Promise<Outcome> {
  // outros tópicos (items, orders) chegam porque a assinatura é por app;
  // aqui só a pergunta vira lead
  if (event.eventType !== "questions") return "ignored";

  const resource = typeof event.payload?.resource === "string" ? event.payload.resource : "";
  const path = questionResource(resource);
  if (!path) return "ignored";

  const question = parseQuestion(await client.getResource(path));
  if (!question || !question.text) return "ignored";

  const db = await getDb();

  /*
   * O anúncio precisa ser de um carro NOSSO. A conta do ML pode ter anúncios
   * que não saíram daqui, e um lead preso a um carro que o painel não conhece
   * mandaria a revenda procurar no estoque uma coisa que não está lá.
   */
  const publication = await db
    .select({
      vehicleId: vehiclePublications.vehicleId,
      externalUrl: vehiclePublications.externalUrl,
    })
    .from(vehiclePublications)
    .where(
      and(
        eq(vehiclePublications.tenantId, tenantId),
        eq(vehiclePublications.portal, "mercadolivre"),
        eq(vehiclePublications.externalId, question.itemId),
      ),
    )
    .limit(1);
  if (!publication[0]) return "ignored";

  const vehicleRows = await db
    .select({
      id: vehicles.id,
      brand: vehicles.brand,
      model: vehicles.model,
      version: vehicles.version,
      yearModel: vehicles.yearModel,
    })
    .from(vehicles)
    .where(eq(vehicles.id, publication[0].vehicleId))
    .limit(1);
  const vehicle = vehicleRows[0] ?? null;
  const vehicleLabel = vehicle ? vehicleLabelOf(vehicle) : null;
  const adUrl = publication[0].externalUrl ?? `https://www.mercadolivre.com.br/p/${question.itemId}`;
  const key = mercadoLivreLeadKey(question);

  const existing = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.tenantId, tenantId), eq(leads.externalId, key)))
    .limit(1);

  if (existing[0]) {
    return (await appendQuestion(tenantId, existing[0].id, question)) ? "appended" : "ignored";
  }

  const name = buyerName(
    await client.getUser(question.fromUserId).catch(() => null),
    question.fromUserId,
  );

  const stages = await listStages(tenantId);
  const firstStage = stages.find((stage) => stage.kind === "open") ?? stages[0] ?? null;
  const assignedToUserId = await pickAssignee(tenantId, null);

  const created = await db
    .insert(leads)
    .values({
      tenantId,
      vehicleId: vehicle?.id ?? null,
      vehicleLabel,
      name,
      // o ML não dá telefone nesta etapa; a tela mostra "—" e esconde o WhatsApp
      phone: "",
      email: null,
      message: `Pergunta no Mercado Livre: "${question.text}"\n\nResponda pelo anúncio: ${adUrl}`,
      source: "portal",
      status: "new",
      stageId: firstStage?.id ?? null,
      assignedToUserId,
      externalId: key,
      utm: { source: "mercadolivre", medium: "portal" },
    })
    .returning({ id: leads.id });

  const leadId = created[0].id;

  await recordLeadEvent({
    tenantId,
    leadId,
    type: "created",
    body: vehicleLabel
      ? `Pergunta no Mercado Livre sobre ${vehicleLabel}.`
      : "Pergunta no Mercado Livre.",
    metadata: { source: "portal", portal: "mercadolivre", questionId: question.id, url: adUrl },
  });

  await dispatchTenantEvent(tenantId, "lead.created", {
    id: leadId,
    name,
    phone: null,
    email: null,
    vehicle: vehicleLabel,
    source: "portal",
    portal: "mercadolivre",
  });

  return "created";
}

/**
 * A segunda pergunta da mesma pessoa no mesmo carro entra como evento.
 *
 * Devolve false quando aquela pergunta já está na linha do tempo: o ML avisa
 * de novo quando a pergunta é respondida, e sem esta conferência a mesma
 * frase apareceria duas vezes para quem atende.
 */
async function appendQuestion(
  tenantId: string,
  leadId: string,
  question: MlQuestion,
): Promise<boolean> {
  const db = await getDb();
  const timeline = await db
    .select({ metadata: leadEvents.metadata })
    .from(leadEvents)
    .where(eq(leadEvents.leadId, leadId));

  const already = timeline.some((row) => row.metadata?.questionId === question.id);
  if (already) return false;

  await recordLeadEvent({
    tenantId,
    leadId,
    type: "note",
    body: `Nova pergunta no Mercado Livre: "${question.text}"`,
    metadata: { portal: "mercadolivre", questionId: question.id },
  });
  return true;
}
