import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { billingStatus, tenants } from "@/db/schema";
import type { BillingStatus } from "@/db/schema";
import type { BlockMode, TenantStatus } from "@/db/schema";
import { cacheKeys, cached, invalidate } from "@/lib/cache";

/** Núcleo do tenant usado em toda request autenticada e no site público. JSON-safe (datas em ms). */
export type TenantCore = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  templateId: string;
  blockMode: BlockMode;
  billing: {
    status: BillingStatus;
    dueDay: number;
    currentDueDate: number | null;
  } | null;
};

const TTL = 60;

async function loadTenantCore(where: "id" | "slug", value: string): Promise<TenantCore | null> {
  const db = await getDb();
  const rows = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      name: tenants.name,
      status: tenants.status,
      templateId: tenants.templateId,
      blockMode: tenants.blockMode,
      billingStatus: billingStatus.status,
      dueDay: billingStatus.dueDay,
      currentDueDate: billingStatus.currentDueDate,
    })
    .from(tenants)
    .leftJoin(billingStatus, eq(billingStatus.tenantId, tenants.id))
    .where(where === "id" ? eq(tenants.id, value) : eq(tenants.slug, value))
    .limit(1);

  const row = rows[0];
  if (!row || row.status === "deleted") return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    templateId: row.templateId,
    blockMode: row.blockMode,
    billing: row.billingStatus
      ? {
          status: row.billingStatus,
          dueDay: row.dueDay ?? 10,
          currentDueDate: row.currentDueDate ? row.currentDueDate.getTime() : null,
        }
      : null,
  };
}

export async function getTenantCoreById(id: string): Promise<TenantCore | null> {
  return cached(cacheKeys.tenantCoreById(id), TTL, () => loadTenantCore("id", id));
}

export async function getTenantCoreBySlug(slug: string): Promise<TenantCore | null> {
  return cached(cacheKeys.tenantCoreBySlug(slug), TTL, () => loadTenantCore("slug", slug));
}

export async function invalidateTenantCache(tenant: { id: string; slug: string }): Promise<void> {
  await invalidate(
    cacheKeys.tenantCoreById(tenant.id),
    cacheKeys.tenantCoreBySlug(tenant.slug),
    cacheKeys.tenantSite(tenant.slug),
  );
}

/** O site público da revenda está no ar? */
export function isPublicSiteAvailable(tenant: TenantCore): boolean {
  if (tenant.status !== "active") return false;
  return tenant.billing?.status !== "suspenso";
}

export type PanelAccess = "full" | "readonly" | "blocked";

/** Nível de acesso ao painel da revenda, considerando suspensão e block_mode. */
export function resolvePanelAccess(tenant: TenantCore): PanelAccess {
  const suspended = tenant.status === "suspended" || tenant.billing?.status === "suspenso";
  if (!suspended) return "full";
  return tenant.blockMode === "full" ? "blocked" : "readonly";
}

/** Vencimento em atraso (informativo — o bloqueio continua sendo decisão manual). */
export function isOverdue(tenant: TenantCore, now = Date.now()): boolean {
  if (!tenant.billing?.currentDueDate) return false;
  return tenant.billing.currentDueDate < now && tenant.billing.status !== "adimplente";
}
