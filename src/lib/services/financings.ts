import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { financings, type Financing, type FinancingStatus } from "@/db/schema";

export type FinancingInput = {
  leadId?: string | null;
  vehicleId?: string | null;
  vehicleLabel?: string | null;
  customerName: string;
  customerDocument?: string | null;
  customerPhone?: string | null;
  bank?: string | null;
  vehiclePriceCents: number;
  downPaymentCents: number;
  installments: number;
  installmentCents: number;
  status: FinancingStatus;
  notes?: string | null;
  storeId?: string | null;
};

/**
 * Valor financiado: preço menos entrada, nunca negativo.
 *
 * Derivado em vez de digitado porque é a conta que a pessoa erra ao preencher
 * às pressas, e um financiado maior que o preço passa despercebido na lista.
 */
export function financedAmount(vehiclePriceCents: number, downPaymentCents: number): number {
  return Math.max(0, vehiclePriceCents - downPaymentCents);
}

/** Quanto o cliente paga no total, somando entrada e parcelas. */
export function totalPaid(
  downPaymentCents: number,
  installments: number,
  installmentCents: number,
): number {
  return downPaymentCents + installments * installmentCents;
}

/**
 * Custo do crédito: o que excede o preço do veículo.
 *
 * É o número que o cliente pergunta e que a revenda raramente tem à mão.
 */
export function creditCost(
  vehiclePriceCents: number,
  downPaymentCents: number,
  installments: number,
  installmentCents: number,
): number {
  return Math.max(0, totalPaid(downPaymentCents, installments, installmentCents) - vehiclePriceCents);
}

export async function listFinancings(
  tenantId: string,
  filters: { status?: FinancingStatus; leadId?: string; storeId?: string } = {},
): Promise<Financing[]> {
  const db = await getDb();
  const conditions = [eq(financings.tenantId, tenantId)];
  if (filters.status) conditions.push(eq(financings.status, filters.status));
  if (filters.leadId) conditions.push(eq(financings.leadId, filters.leadId));
  if (filters.storeId) conditions.push(eq(financings.storeId, filters.storeId));

  return db
    .select()
    .from(financings)
    .where(and(...conditions))
    .orderBy(desc(financings.createdAt))
    .limit(200);
}

export async function getFinancing(tenantId: string, id: string): Promise<Financing | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(financings)
    .where(and(eq(financings.tenantId, tenantId), eq(financings.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

/** Estados que encerram a proposta e por isso carimbam a data da decisão. */
const DECIDED: FinancingStatus[] = ["aprovado", "recusado", "contratado", "cancelado"];

export async function createFinancing(
  tenantId: string,
  userId: string | null,
  input: FinancingInput,
): Promise<string> {
  const db = await getDb();
  const created = await db
    .insert(financings)
    .values({
      ...input,
      tenantId,
      createdByUserId: userId,
      financedCents: financedAmount(input.vehiclePriceCents, input.downPaymentCents),
      decidedAt: DECIDED.includes(input.status) ? new Date() : null,
    })
    .returning({ id: financings.id });
  return created[0].id;
}

export async function updateFinancing(
  tenantId: string,
  id: string,
  input: Partial<FinancingInput>,
): Promise<boolean> {
  const db = await getDb();
  const current = await getFinancing(tenantId, id);
  if (!current) return false;

  const price = input.vehiclePriceCents ?? current.vehiclePriceCents;
  const down = input.downPaymentCents ?? current.downPaymentCents;
  const status = input.status ?? current.status;

  await db
    .update(financings)
    .set({
      ...input,
      financedCents: financedAmount(price, down),
      // a data da decisão é carimbada na virada, não a cada salvamento: editar
      // uma observação não pode reescrever quando o banco respondeu
      decidedAt:
        status !== current.status && DECIDED.includes(status)
          ? new Date()
          : DECIDED.includes(status)
            ? current.decidedAt
            : null,
    })
    .where(and(eq(financings.tenantId, tenantId), eq(financings.id, id)));
  return true;
}

export async function deleteFinancing(tenantId: string, id: string): Promise<boolean> {
  const db = await getDb();
  const current = await getFinancing(tenantId, id);
  if (!current) return false;
  await db
    .delete(financings)
    .where(and(eq(financings.tenantId, tenantId), eq(financings.id, id)));
  return true;
}

export async function financingSummary(tenantId: string) {
  const db = await getDb();
  const rows = await db
    .select({
      status: financings.status,
      total: sql<number>`count(*)`,
      valor: sql<number>`coalesce(sum(${financings.financedCents}), 0)`,
    })
    .from(financings)
    .where(eq(financings.tenantId, tenantId))
    .groupBy(financings.status);

  return rows.map((row) => ({
    status: row.status,
    quantidade: Number(row.total),
    valorCents: Number(row.valor),
  }));
}
