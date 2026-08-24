import type { BillingStatus, BlockMode, TenantStatus } from "@/db/schema";

/**
 * Régua de cobrança e de acesso — funções puras, sem banco e sem bindings.
 * Mora separada do service justamente para ser testável e para o mesmo cálculo
 * valer no request (bloqueio imediato) e no job que persiste as viradas.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

export type BillingSnapshot = {
  status: BillingStatus;
  dueDay: number;
  graceDays: number;
  currentDueDate: number | null;
} | null;

export type TenantAccessInput = {
  status: TenantStatus;
  blockMode: BlockMode;
  billing: BillingSnapshot;
};

/**
 * Situação financeira REAL, considerando o vencimento — não só a gravada.
 * Assim o bloqueio funciona mesmo sem nenhum agendador rodando.
 */
export function effectiveBillingStatus(tenant: TenantAccessInput, now = Date.now()): BillingStatus {
  const billing = tenant.billing;
  if (!billing) return "adimplente";
  if (billing.status === "suspenso") return "suspenso";
  if (!billing.currentDueDate) return billing.status;

  const overdueMs = now - billing.currentDueDate;
  if (overdueMs <= 0) return billing.status;
  if (overdueMs > billing.graceDays * DAY_MS) return "suspenso";
  return "inadimplente";
}

/** Vencido, independente do que está gravado. */
export function isOverdue(tenant: TenantAccessInput, now = Date.now()): boolean {
  const dueDate = tenant.billing?.currentDueDate;
  return Boolean(dueDate && dueDate < now);
}

/** Dias restantes de tolerância antes da suspensão automática. */
export function graceDaysLeft(tenant: TenantAccessInput, now = Date.now()): number | null {
  const billing = tenant.billing;
  if (!billing?.currentDueDate || billing.status === "suspenso") return null;
  if (now <= billing.currentDueDate) return null;
  const deadline = billing.currentDueDate + billing.graceDays * DAY_MS;
  return Math.max(0, Math.ceil((deadline - now) / DAY_MS));
}

/** O site público da revenda está no ar? */
export function isPublicSiteAvailable(tenant: TenantAccessInput, now = Date.now()): boolean {
  if (tenant.status !== "active") return false;
  return effectiveBillingStatus(tenant, now) !== "suspenso";
}

export type PanelAccess = "full" | "readonly" | "blocked";

/** Nível de acesso ao painel da revenda, considerando suspensão e block_mode. */
export function resolvePanelAccess(tenant: TenantAccessInput, now = Date.now()): PanelAccess {
  const suspended =
    tenant.status === "suspended" || effectiveBillingStatus(tenant, now) === "suspenso";
  if (!suspended) return "full";
  return tenant.blockMode === "full" ? "blocked" : "readonly";
}
