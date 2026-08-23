import { and, count, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  billingEvents,
  billingStatus,
  leads,
  tenantSites,
  tenants,
  users,
  vehicles,
  type BillingStatus,
  type Tenant,
  type TenantStatus,
} from "@/db/schema";
import { invalidateTenantCache } from "@/lib/tenant/service";

export type TenantListItem = {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  templateId: string;
  createdAt: Date;
  billingStatus: BillingStatus | null;
  currentDueDate: Date | null;
  amountCents: number | null;
};

export type TenantListFilters = {
  search?: string;
  status?: TenantStatus;
  billing?: BillingStatus;
  page?: number;
  pageSize?: number;
};

export async function listTenants(filters: TenantListFilters = {}) {
  const db = await getDb();
  const pageSize = Math.min(filters.pageSize ?? 20, 100);
  const page = Math.max(filters.page ?? 1, 1);

  const conditions = [ne(tenants.status, "deleted" as TenantStatus)];
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(like(sql`lower(${tenants.name})`, term), like(tenants.slug, term))!,
    );
  }
  if (filters.status) conditions.push(eq(tenants.status, filters.status));
  if (filters.billing) conditions.push(eq(billingStatus.status, filters.billing));

  const where = and(...conditions);

  const rows = await db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      status: tenants.status,
      templateId: tenants.templateId,
      createdAt: tenants.createdAt,
      billingStatus: billingStatus.status,
      currentDueDate: billingStatus.currentDueDate,
      amountCents: billingStatus.amountCents,
    })
    .from(tenants)
    .leftJoin(billingStatus, eq(billingStatus.tenantId, tenants.id))
    .where(where)
    .orderBy(desc(tenants.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db
    .select({ value: count() })
    .from(tenants)
    .leftJoin(billingStatus, eq(billingStatus.tenantId, tenants.id))
    .where(where);

  return {
    items: rows as TenantListItem[],
    total: totalRows[0]?.value ?? 0,
    page,
    pageSize,
  };
}

export async function getTenantDetail(id: string) {
  const db = await getDb();

  const rows = await db
    .select({
      tenant: tenants,
      billing: billingStatus,
      site: tenantSites,
    })
    .from(tenants)
    .leftJoin(billingStatus, eq(billingStatus.tenantId, tenants.id))
    .leftJoin(tenantSites, eq(tenantSites.tenantId, tenants.id))
    .where(eq(tenants.id, id))
    .limit(1);

  const row = rows[0];
  if (!row || row.tenant.status === "deleted") return null;

  const [vehicleCount, leadCount, userCount] = await Promise.all([
    db.select({ value: count() }).from(vehicles).where(eq(vehicles.tenantId, id)),
    db.select({ value: count() }).from(leads).where(eq(leads.tenantId, id)),
    db.select({ value: count() }).from(users).where(eq(users.tenantId, id)),
  ]);

  return {
    tenant: row.tenant,
    billing: row.billing,
    site: row.site,
    counters: {
      vehicles: vehicleCount[0]?.value ?? 0,
      leads: leadCount[0]?.value ?? 0,
      users: userCount[0]?.value ?? 0,
    },
  };
}

export async function isSlugTaken(slug: string, exceptTenantId?: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  const found = rows[0];
  if (!found) return false;
  return found.id !== exceptTenantId;
}

/** Próximo vencimento a partir do dia configurado. */
export function nextDueDate(dueDay: number, from = new Date()): Date {
  const due = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), dueDay, 12));
  if (due.getTime() < from.getTime()) due.setUTCMonth(due.getUTCMonth() + 1);
  return due;
}

export async function updateTenantRecord(
  id: string,
  values: Partial<Tenant>,
): Promise<Tenant | null> {
  const db = await getDb();
  const previous = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!previous[0]) return null;

  const updated = await db.update(tenants).set(values).where(eq(tenants.id, id)).returning();

  await invalidateTenantCache(previous[0]);
  if (updated[0] && updated[0].slug !== previous[0].slug) {
    await invalidateTenantCache(updated[0]);
  }

  return updated[0] ?? null;
}

export async function registerBillingEvent(input: {
  tenantId: string;
  type: "payment" | "status_change" | "note";
  amountCents?: number | null;
  referenceMonth?: string | null;
  statusFrom?: BillingStatus | null;
  statusTo?: BillingStatus | null;
  note?: string | null;
  actor: { userId: string | null; email: string | null };
}): Promise<void> {
  const db = await getDb();
  await db.insert(billingEvents).values({
    tenantId: input.tenantId,
    type: input.type,
    amountCents: input.amountCents ?? null,
    referenceMonth: input.referenceMonth ?? null,
    statusFrom: input.statusFrom ?? null,
    statusTo: input.statusTo ?? null,
    note: input.note ?? null,
    createdByUserId: input.actor.userId,
    createdByEmail: input.actor.email,
  });
}

export async function listBillingEvents(tenantId: string, limit = 30) {
  const db = await getDb();
  return db
    .select()
    .from(billingEvents)
    .where(eq(billingEvents.tenantId, tenantId))
    .orderBy(desc(billingEvents.createdAt))
    .limit(limit);
}

export type PlatformStats = {
  tenantsTotal: number;
  tenantsActive: number;
  tenantsSuspended: number;
  overdue: number;
  vehicles: number;
  leadsNew: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const db = await getDb();
  const activeTenants = ne(tenants.status, "deleted" as TenantStatus);

  const [total, active, suspended, overdue, vehicleTotal, newLeads] = await Promise.all([
    db.select({ value: count() }).from(tenants).where(activeTenants),
    db.select({ value: count() }).from(tenants).where(and(activeTenants, eq(tenants.status, "active"))),
    db.select({ value: count() }).from(tenants).where(and(activeTenants, eq(tenants.status, "suspended"))),
    db
      .select({ value: count() })
      .from(billingStatus)
      .where(ne(billingStatus.status, "adimplente" as BillingStatus)),
    db.select({ value: count() }).from(vehicles),
    db.select({ value: count() }).from(leads).where(eq(leads.status, "new")),
  ]);

  return {
    tenantsTotal: total[0]?.value ?? 0,
    tenantsActive: active[0]?.value ?? 0,
    tenantsSuspended: suspended[0]?.value ?? 0,
    overdue: overdue[0]?.value ?? 0,
    vehicles: vehicleTotal[0]?.value ?? 0,
    leadsNew: newLeads[0]?.value ?? 0,
  };
}
