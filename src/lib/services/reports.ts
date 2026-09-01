import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, pipelineStages, users, vehicles } from "@/db/schema";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type Period = 7 | 30 | 90;

/**
 * Conversão: ganhos sobre o que já foi decidido.
 *
 * O denominador exclui lead em aberto de propósito. Contando o que ainda está
 * sendo trabalhado, a taxa despenca sempre que entra lead novo — e o número
 * cai justamente na semana boa, quando chegou mais gente.
 */
export function conversionRate(won: number, lost: number): number | null {
  const decided = won + lost;
  if (decided === 0) return null;
  return Math.round((won / decided) * 1000) / 10;
}

/** Dias entre a entrada no estoque e hoje. */
export function daysInStock(createdAt: Date, now = Date.now()): number {
  return Math.max(0, Math.floor((now - createdAt.getTime()) / DAY_MS));
}

export type SalesReport = {
  periodo: Period;
  leads: { total: number; novos: number; ganhos: number; perdidos: number; emAberto: number };
  conversao: number | null;
  porOrigem: { origem: string; total: number }[];
  porEtapa: { etapa: string; tipo: string; total: number }[];
  porVendedor: { nome: string; total: number; ganhos: number }[];
  estoque: {
    disponiveis: number;
    reservados: number;
    vendidos: number;
    valorTotalCents: number;
    precoMedioCents: number;
    paradosMais60: number;
  };
};

export async function buildSalesReport(
  tenantId: string,
  periodo: Period = 30,
  storeId?: string | null,
): Promise<SalesReport> {
  const db = await getDb();
  const since = new Date(Date.now() - periodo * DAY_MS);

  const leadScope = [eq(leads.tenantId, tenantId), gte(leads.createdAt, since)];
  if (storeId) leadScope.push(eq(leads.storeId, storeId));

  const byStatus = await db
    .select({ status: leads.status, total: sql<number>`count(*)` })
    .from(leads)
    .where(and(...leadScope))
    .groupBy(leads.status);

  const count = (status: string) =>
    Number(byStatus.find((row) => row.status === status)?.total ?? 0);

  const ganhos = count("won");
  const perdidos = count("lost");
  const total = byStatus.reduce((sum, row) => sum + Number(row.total), 0);

  const porOrigem = await db
    .select({ origem: leads.source, total: sql<number>`count(*)` })
    .from(leads)
    .where(and(...leadScope))
    .groupBy(leads.source);

  const porEtapa = await db
    .select({
      etapa: pipelineStages.name,
      tipo: pipelineStages.kind,
      total: sql<number>`count(${leads.id})`,
    })
    .from(pipelineStages)
    .leftJoin(leads, and(eq(leads.stageId, pipelineStages.id), gte(leads.createdAt, since)))
    .where(eq(pipelineStages.tenantId, tenantId))
    .groupBy(pipelineStages.id)
    .orderBy(pipelineStages.position);

  const porVendedor = await db
    .select({
      nome: users.name,
      total: sql<number>`count(${leads.id})`,
      ganhos: sql<number>`sum(case when ${leads.status} = 'won' then 1 else 0 end)`,
    })
    .from(users)
    .leftJoin(leads, and(eq(leads.assignedToUserId, users.id), gte(leads.createdAt, since)))
    .where(and(eq(users.tenantId, tenantId), inArray(users.role, ["revenda_admin", "vendedor"])))
    .groupBy(users.id);

  const vehicleScope = [eq(vehicles.tenantId, tenantId)];
  if (storeId) vehicleScope.push(eq(vehicles.storeId, storeId));

  const stockRows = await db
    .select({
      status: vehicles.status,
      total: sql<number>`count(*)`,
      valor: sql<number>`coalesce(sum(${vehicles.priceCents}), 0)`,
    })
    .from(vehicles)
    .where(and(...vehicleScope))
    .groupBy(vehicles.status);

  const stock = (status: string) =>
    Number(stockRows.find((row) => row.status === status)?.total ?? 0);
  const disponiveis = stock("available");
  const reservados = stock("reserved");

  const valorTotalCents = stockRows
    .filter((row) => row.status === "available" || row.status === "reserved")
    .reduce((sum, row) => sum + Number(row.valor), 0);

  const parados = await db
    .select({ total: sql<number>`count(*)` })
    .from(vehicles)
    .where(
      and(
        ...vehicleScope,
        inArray(vehicles.status, ["available", "reserved"]),
        sql`${vehicles.createdAt} < ${Date.now() - 60 * DAY_MS}`,
      ),
    );

  const ativos = disponiveis + reservados;

  return {
    periodo,
    leads: {
      total,
      novos: count("new"),
      ganhos,
      perdidos,
      emAberto: count("new") + count("in_progress"),
    },
    conversao: conversionRate(ganhos, perdidos),
    porOrigem: porOrigem.map((row) => ({ origem: row.origem, total: Number(row.total) })),
    porEtapa: porEtapa.map((row) => ({
      etapa: row.etapa,
      tipo: row.tipo,
      total: Number(row.total),
    })),
    porVendedor: porVendedor
      .map((row) => ({
        nome: row.nome,
        total: Number(row.total),
        ganhos: Number(row.ganhos ?? 0),
      }))
      .sort((a, b) => b.total - a.total),
    estoque: {
      disponiveis,
      reservados,
      vendidos: stock("sold"),
      valorTotalCents,
      precoMedioCents: ativos > 0 ? Math.round(valorTotalCents / ativos) : 0,
      paradosMais60: Number(parados[0]?.total ?? 0),
    },
  };
}
