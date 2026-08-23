import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLog, tenants } from "@/db/schema";

export type AuditFilters = {
  search?: string;
  tenantId?: string;
  action?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditLog(filters: AuditFilters = {}) {
  const db = await getDb();
  const pageSize = Math.min(filters.pageSize ?? 40, 100);
  const page = Math.max(filters.page ?? 1, 1);

  const conditions = [];
  if (filters.tenantId) conditions.push(eq(auditLog.tenantId, filters.tenantId));
  if (filters.action) conditions.push(like(auditLog.action, `${filters.action}%`));
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(like(sql`lower(${auditLog.actorEmail})`, term), like(auditLog.action, term))!,
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: auditLog.id,
      actorEmail: auditLog.actorEmail,
      actorRole: auditLog.actorRole,
      impersonated: auditLog.impersonated,
      action: auditLog.action,
      entity: auditLog.entity,
      entityId: auditLog.entityId,
      tenantId: auditLog.tenantId,
      tenantName: tenants.name,
      metadata: auditLog.metadata,
      ip: auditLog.ip,
      createdAt: auditLog.createdAt,
    })
    .from(auditLog)
    .leftJoin(tenants, eq(tenants.id, auditLog.tenantId))
    .where(where)
    .orderBy(desc(auditLog.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const totalRows = await db.select({ value: count() }).from(auditLog).where(where);

  return { items: rows, total: totalRows[0]?.value ?? 0, page, pageSize };
}

/** Ações distintas já registradas — alimenta o filtro da tela de auditoria. */
export async function listAuditActions(): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .selectDistinct({ action: auditLog.action })
    .from(auditLog)
    .orderBy(auditLog.action)
    .limit(100);
  return rows.map((row) => row.action);
}
