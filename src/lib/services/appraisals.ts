import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  vehicleAppraisals,
  type AppraisalStatus,
  type VehicleAppraisal,
} from "@/db/schema";

export type AppraisalInput = {
  leadId?: string | null;
  customerName: string;
  customerPhone?: string | null;
  storeId?: string | null;

  brand: string;
  model: string;
  version?: string | null;
  yearManufacture: number;
  yearModel: number;
  mileageKm: number;
  color?: string | null;
  licensePlateEnd?: string | null;

  fipeCode?: string | null;
  fipePriceCents: number;
  fipeReference?: string | null;

  conditionCents: number;
  repairsCents: number;
  debtsCents: number;
  marketAdjustCents: number;

  offerCents: number;
  targetSaleCents: number;

  status: AppraisalStatus;
  validUntil?: Date | null;
  notes?: string | null;
};

/* ------------------------------------------------------------------------ */
/* A conta                                                                   */
/* ------------------------------------------------------------------------ */

export type Deductions = {
  fipePriceCents: number;
  conditionCents: number;
  repairsCents: number;
  debtsCents: number;
  marketAdjustCents: number;
};

/**
 * O valor que a tabela e os descontos sugerem pagar.
 *
 * Derivado, nunca digitado: é a conta que a pessoa faz de cabeça no pátio, e
 * de cabeça ela erra. Some no fim porque `marketAdjustCents` é o único que
 * pode ser negativo — carro de giro rápido às vezes vale acima da tabela.
 *
 * Nunca desce abaixo de zero. Um carro com mais dívida que valor existe, mas
 * "a revenda paga menos zero" não quer dizer nada; nesse caso o número certo
 * é zero e a conversa é outra.
 */
export function suggestedOffer(deductions: Deductions): number {
  const raw =
    deductions.fipePriceCents -
    deductions.conditionCents -
    deductions.repairsCents -
    deductions.debtsCents +
    deductions.marketAdjustCents;
  return Math.max(0, Math.round(raw));
}

/**
 * Quanto o carro custa para a revenda, já pronto para vender.
 *
 * Reparo e dívida entram aqui além de terem descido a oferta, e isso não é
 * contagem dobrada: o desconto define quanto se paga ao cliente, e o gasto
 * acontece depois, do bolso da revenda. Comprei por 47 um carro de 50 com 3 de
 * reparo — gastei 50 no total.
 *
 * Desgaste (`conditionCents`) fica de fora de propósito: é perda de valor, não
 * dinheiro que sai do caixa.
 */
export function acquisitionCost(
  offerCents: number,
  repairsCents: number,
  debtsCents: number,
): number {
  return offerCents + repairsCents + debtsCents;
}

/**
 * O que sobra se vender pelo preço pretendido.
 *
 * Pode ser negativo, e é justamente por isso que existe: negócio ruim precisa
 * aparecer em vermelho na tela antes de o vendedor prometer o valor.
 */
export function appraisalMargin(
  targetSaleCents: number,
  offerCents: number,
  repairsCents: number,
  debtsCents: number,
): number {
  return targetSaleCents - acquisitionCost(offerCents, repairsCents, debtsCents);
}

/** Margem sobre o preço de venda, em porcentagem. Nula quando não há preço. */
export function marginPercent(marginCents: number, targetSaleCents: number): number | null {
  if (targetSaleCents <= 0) return null;
  return (marginCents / targetSaleCents) * 100;
}

/**
 * Distância entre o que se ofereceu e o que a conta sugeria.
 *
 * Positivo = ofertou acima do sugerido. É o número que o dono da revenda quer
 * ver na lista: pagar acima da conta é decisão legítima, mas precisa ser
 * visível e ter nome de quem decidiu.
 */
export function offerGapPercent(offerCents: number, suggestedCents: number): number | null {
  if (suggestedCents <= 0) return null;
  return ((offerCents - suggestedCents) / suggestedCents) * 100;
}

/** Proposta vencida — o preço de usado envelhece rápido demais para valer sempre. */
export function isExpired(validUntil: Date | null, now: Date): boolean {
  if (!validUntil) return false;
  return validUntil.getTime() < now.getTime();
}

/* ------------------------------------------------------------------------ */
/* Persistência                                                              */
/* ------------------------------------------------------------------------ */

/** Estados que encerram a avaliação e por isso carimbam a data da decisão. */
const DECIDED: AppraisalStatus[] = ["aceita", "recusada", "expirada"];

export async function listAppraisals(
  tenantId: string,
  filters: { status?: AppraisalStatus; leadId?: string } = {},
): Promise<VehicleAppraisal[]> {
  const db = await getDb();
  const conditions = [eq(vehicleAppraisals.tenantId, tenantId)];
  if (filters.status) conditions.push(eq(vehicleAppraisals.status, filters.status));
  if (filters.leadId) conditions.push(eq(vehicleAppraisals.leadId, filters.leadId));

  return db
    .select()
    .from(vehicleAppraisals)
    .where(and(...conditions))
    .orderBy(desc(vehicleAppraisals.createdAt))
    .limit(200);
}

export async function getAppraisal(
  tenantId: string,
  id: string,
): Promise<VehicleAppraisal | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(vehicleAppraisals)
    .where(and(eq(vehicleAppraisals.tenantId, tenantId), eq(vehicleAppraisals.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createAppraisal(
  tenantId: string,
  userId: string | null,
  input: AppraisalInput,
): Promise<string> {
  const db = await getDb();
  const created = await db
    .insert(vehicleAppraisals)
    .values({
      ...input,
      tenantId,
      createdByUserId: userId,
      // o sugerido é recalculado aqui, não aceito do navegador: a conta é o
      // produto, e ela não pode depender de o cliente ter somado direito
      suggestedCents: suggestedOffer(input),
      decidedAt: DECIDED.includes(input.status) ? new Date() : null,
    })
    .returning({ id: vehicleAppraisals.id });
  return created[0].id;
}

export async function updateAppraisal(
  tenantId: string,
  id: string,
  input: Partial<AppraisalInput>,
): Promise<boolean> {
  const db = await getDb();
  const current = await getAppraisal(tenantId, id);
  if (!current) return false;

  const status = input.status ?? current.status;

  await db
    .update(vehicleAppraisals)
    .set({
      ...input,
      suggestedCents: suggestedOffer({
        fipePriceCents: input.fipePriceCents ?? current.fipePriceCents,
        conditionCents: input.conditionCents ?? current.conditionCents,
        repairsCents: input.repairsCents ?? current.repairsCents,
        debtsCents: input.debtsCents ?? current.debtsCents,
        marketAdjustCents: input.marketAdjustCents ?? current.marketAdjustCents,
      }),
      // a data da decisão é carimbada na virada, não a cada salvamento: corrigir
      // uma observação não pode reescrever quando o cliente respondeu
      decidedAt:
        status !== current.status && DECIDED.includes(status)
          ? new Date()
          : DECIDED.includes(status)
            ? current.decidedAt
            : null,
    })
    .where(and(eq(vehicleAppraisals.tenantId, tenantId), eq(vehicleAppraisals.id, id)));
  return true;
}

export async function deleteAppraisal(tenantId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const current = await getAppraisal(tenantId, id);
  if (!current) return false;
  await db
    .delete(vehicleAppraisals)
    .where(and(eq(vehicleAppraisals.tenantId, tenantId), eq(vehicleAppraisals.id, id)));
  return true;
}

/**
 * Marca a avaliação como já virada ficha de estoque.
 *
 * Sem isso não há como perguntar depois quanto custou o carro que está à
 * venda — a avaliação é o único lugar onde o preço de compra existe.
 */
export async function linkAppraisalToVehicle(
  tenantId: string,
  id: string,
  vehicleId: string,
): Promise<boolean> {
  const db = await getDb();
  const current = await getAppraisal(tenantId, id);
  if (!current) return false;

  await db
    .update(vehicleAppraisals)
    .set({ vehicleId })
    .where(and(eq(vehicleAppraisals.tenantId, tenantId), eq(vehicleAppraisals.id, id)));
  return true;
}

export async function appraisalSummary(tenantId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      status: vehicleAppraisals.status,
      total: sql<number>`count(*)`,
      valor: sql<number>`coalesce(sum(${vehicleAppraisals.offerCents}), 0)`,
    })
    .from(vehicleAppraisals)
    .where(eq(vehicleAppraisals.tenantId, tenantId))
    .groupBy(vehicleAppraisals.status);

  return rows.map((row) => ({
    status: row.status,
    quantidade: Number(row.total),
    valorCents: Number(row.valor),
  }));
}
