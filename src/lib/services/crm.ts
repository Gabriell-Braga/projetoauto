import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { getDb } from "@/db";
import {
  leadEvents,
  leadRouting,
  leads,
  pipelineStages,
  users,
  type DistributionMode,
  type LeadEventType,
  type PipelineStage,
  type StageKind,
} from "@/db/schema";
import { badRequest } from "@/lib/http";

/* ------------------------------------------------------------------------ */
/* Funil                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Funil inicial, criado na primeira vez que a revenda abre a tela.
 *
 * Vem preenchido de propósito: funil vazio obriga a pessoa a inventar um
 * processo antes de conseguir usar a tela, e quase toda revenda trabalha
 * alguma variação disto.
 */
export const DEFAULT_STAGES: { name: string; kind: StageKind }[] = [
  { name: "Novo", kind: "open" },
  { name: "Em contato", kind: "open" },
  { name: "Visita agendada", kind: "open" },
  { name: "Proposta", kind: "open" },
  { name: "Vendido", kind: "won" },
  { name: "Perdido", kind: "lost" },
];

export async function listStages(tenantId: string): Promise<PipelineStage[]> {
  const db = await getDb();
  return db
    .select()
    .from(pipelineStages)
    .where(eq(pipelineStages.tenantId, tenantId))
    .orderBy(asc(pipelineStages.position));
}

/** Garante um funil utilizável, criando o padrão na primeira visita. */
export async function ensureStages(tenantId: string): Promise<PipelineStage[]> {
  const existing = await listStages(tenantId);
  if (existing.length > 0) return existing;

  const db = await getDb();
  await db.insert(pipelineStages).values(
    DEFAULT_STAGES.map((stage, index) => ({
      tenantId,
      name: stage.name,
      kind: stage.kind,
      position: index,
    })),
  );
  return listStages(tenantId);
}

export async function createStage(
  tenantId: string,
  input: { name: string; kind: StageKind },
): Promise<string> {
  const db = await getDb();
  const existing = await listStages(tenantId);

  const created = await db
    .insert(pipelineStages)
    .values({ tenantId, name: input.name, kind: input.kind, position: existing.length })
    .returning({ id: pipelineStages.id });
  return created[0].id;
}

export async function updateStage(
  tenantId: string,
  id: string,
  input: { name?: string; kind?: StageKind; active?: boolean },
): Promise<void> {
  const db = await getDb();
  await db
    .update(pipelineStages)
    .set(input)
    .where(and(eq(pipelineStages.tenantId, tenantId), eq(pipelineStages.id, id)));
}

export async function reorderStages(tenantId: string, ids: string[]): Promise<void> {
  const db = await getDb();
  const owned = await db
    .select({ id: pipelineStages.id })
    .from(pipelineStages)
    .where(and(eq(pipelineStages.tenantId, tenantId), inArray(pipelineStages.id, ids)));

  // se veio id de outra revenda na lista, a reordenação inteira é recusada
  if (owned.length !== ids.length) throw badRequest("Etapa não encontrada neste funil");

  for (const [index, id] of ids.entries()) {
    await db
      .update(pipelineStages)
      .set({ position: index })
      .where(and(eq(pipelineStages.tenantId, tenantId), eq(pipelineStages.id, id)));
  }
}

/**
 * Remove a etapa e devolve os leads dela para a primeira etapa aberta.
 *
 * Lead sem etapa some do quadro, e some sem aviso — quem excluiu a etapa não
 * relaciona o sumiço com o que fez.
 */
export async function deleteStage(tenantId: string, id: string): Promise<void> {
  const db = await getDb();
  const stages = await listStages(tenantId);
  if (stages.length <= 1) throw badRequest("O funil precisa de pelo menos uma etapa");

  const fallback = stages.find((stage) => stage.id !== id && stage.kind === "open") ??
    stages.find((stage) => stage.id !== id);
  if (!fallback) throw badRequest("Nenhuma etapa para receber os leads");

  await db
    .update(leads)
    .set({ stageId: fallback.id })
    .where(and(eq(leads.tenantId, tenantId), eq(leads.stageId, id)));

  await db
    .delete(pipelineStages)
    .where(and(eq(pipelineStages.tenantId, tenantId), eq(pipelineStages.id, id)));
}

/* ------------------------------------------------------------------------ */
/* Linha do tempo                                                            */
/* ------------------------------------------------------------------------ */

export async function listLeadEvents(tenantId: string, leadId: string) {
  const db = await getDb();
  return db
    .select()
    .from(leadEvents)
    .where(and(eq(leadEvents.tenantId, tenantId), eq(leadEvents.leadId, leadId)))
    .orderBy(desc(leadEvents.createdAt));
}

export async function recordLeadEvent(input: {
  tenantId: string;
  leadId: string;
  type: LeadEventType;
  body?: string | null;
  userId?: string | null;
  userName?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = await getDb();
  await db.insert(leadEvents).values({
    tenantId: input.tenantId,
    leadId: input.leadId,
    type: input.type,
    body: input.body ?? null,
    userId: input.userId ?? null,
    userName: input.userName ?? null,
    metadata: input.metadata,
  });
}

/* ------------------------------------------------------------------------ */
/* Distribuição automática                                                   */
/* ------------------------------------------------------------------------ */

export async function getRouting(tenantId: string) {
  const db = await getDb();
  const rows = await db
    .select()
    .from(leadRouting)
    .where(eq(leadRouting.tenantId, tenantId))
    .limit(1);
  return rows[0] ?? { tenantId, mode: "off" as DistributionMode, lastAssignedUserId: null };
}

export async function setRouting(tenantId: string, mode: DistributionMode): Promise<void> {
  const db = await getDb();
  const existing = await db
    .select({ tenantId: leadRouting.tenantId })
    .from(leadRouting)
    .where(eq(leadRouting.tenantId, tenantId))
    .limit(1);

  if (existing[0]) {
    await db.update(leadRouting).set({ mode }).where(eq(leadRouting.tenantId, tenantId));
    return;
  }
  await db.insert(leadRouting).values({ tenantId, mode });
}

/**
 * Próximo da fila, a partir de quem recebeu por último.
 *
 * Função pura porque é onde o rodízio erra: quem recebeu por último pode ter
 * saído da equipe, e `indexOf` devolve -1 nesse caso. Com `-1 + 1 = 0` a fila
 * recomeça do primeiro, que é o comportamento certo — mas é fácil quebrar sem
 * perceber ao mexer, e o sintoma seria um vendedor recebendo tudo.
 */
export function nextInRotation(candidateIds: string[], lastAssignedId: string | null): string | null {
  if (candidateIds.length === 0) return null;
  const lastIndex = lastAssignedId ? candidateIds.indexOf(lastAssignedId) : -1;
  return candidateIds[(lastIndex + 1) % candidateIds.length];
}

/**
 * Escolhe quem recebe o próximo lead.
 *
 * Rodízio simples e persistido: a partir de quem recebeu por último, o próximo
 * da fila. O ponteiro fica no banco porque cada lead chega numa requisição
 * diferente, e sem ele a fila recomeçaria do início toda vez — o primeiro
 * vendedor da lista receberia tudo.
 *
 * `by_store` faz o rodízio dentro da unidade do lead. Sem unidade definida,
 * cai no rodízio geral em vez de ficar sem dono.
 */
export async function pickAssignee(
  tenantId: string,
  storeId: string | null,
): Promise<string | null> {
  const routing = await getRouting(tenantId);
  if (routing.mode === "off") return null;

  const db = await getDb();
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.tenantId, tenantId),
        eq(users.status, "active"),
        eq(users.receivesLeads, true),
        inArray(users.role, ["revenda_admin", "vendedor"]),
        routing.mode === "by_store" && storeId
          ? or(eq(users.storeId, storeId), isNull(users.storeId))!
          : undefined,
      ),
    )
    .orderBy(asc(users.createdAt), asc(users.id));

  const nextId = nextInRotation(
    candidates.map((user) => user.id),
    routing.lastAssignedUserId,
  );
  if (!nextId) return null;

  const existing = await db
    .select({ tenantId: leadRouting.tenantId })
    .from(leadRouting)
    .where(eq(leadRouting.tenantId, tenantId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(leadRouting)
      .set({ lastAssignedUserId: nextId })
      .where(eq(leadRouting.tenantId, tenantId));
  } else {
    await db.insert(leadRouting).values({ tenantId, mode: routing.mode, lastAssignedUserId: nextId });
  }

  return nextId;
}

/* ------------------------------------------------------------------------ */
/* Quadro do funil                                                           */
/* ------------------------------------------------------------------------ */

export type BoardCard = {
  id: string;
  name: string;
  phone: string;
  vehicleLabel: string | null;
  assignedToName: string | null;
  createdAt: string;
  source: string;
};

export type BoardColumn = {
  id: string;
  name: string;
  kind: StageKind;
  cards: BoardCard[];
};

/**
 * Leads agrupados por etapa.
 *
 * Fechados entram só se decididos dentro da janela: sem isso, "Vendido" e
 * "Perdido" acumulam para sempre e o quadro fica ilegível depois de alguns
 * meses. As colunas abertas mostram tudo, porque lead parado há muito tempo é
 * justamente o que precisa aparecer.
 */
export async function loadBoard(tenantId: string, closedWindowDays = 30): Promise<BoardColumn[]> {
  const stages = await ensureStages(tenantId);
  const db = await getDb();
  const since = new Date(Date.now() - closedWindowDays * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      vehicleLabel: leads.vehicleLabel,
      stageId: leads.stageId,
      source: leads.source,
      createdAt: leads.createdAt,
      updatedAt: leads.updatedAt,
      assignedToName: users.name,
    })
    .from(leads)
    .leftJoin(users, eq(users.id, leads.assignedToUserId))
    .where(eq(leads.tenantId, tenantId))
    .orderBy(desc(leads.createdAt))
    .limit(1000);

  const closedStageIds = new Set(
    stages.filter((stage) => stage.kind !== "open").map((stage) => stage.id),
  );

  return stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    kind: stage.kind,
    cards: rows
      .filter((row) => row.stageId === stage.id)
      .filter((row) => !closedStageIds.has(stage.id) || row.updatedAt >= since)
      .map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        vehicleLabel: row.vehicleLabel,
        assignedToName: row.assignedToName,
        source: row.source,
        createdAt: row.createdAt.toISOString(),
      })),
  }));
}

/** Leads que ainda não entraram no funil — existiam antes de ele ser criado. */
export async function countLeadsWithoutStage(tenantId: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.tenantId, tenantId), isNull(leads.stageId)));
  return rows.length;
}

/** Coloca na primeira etapa aberta os leads que ficaram de fora do funil. */
export async function adoptOrphanLeads(tenantId: string): Promise<number> {
  const stages = await ensureStages(tenantId);
  const first = stages.find((stage) => stage.kind === "open") ?? stages[0];
  if (!first) return 0;

  const db = await getDb();
  const updated = await db
    .update(leads)
    .set({ stageId: first.id })
    .where(and(eq(leads.tenantId, tenantId), isNull(leads.stageId)))
    .returning({ id: leads.id });
  return updated.length;
}
