import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn } from "./_shared";

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: idColumn(),
    actorUserId: text("actor_user_id"),
    actorEmail: text("actor_email"),
    actorRole: text("actor_role"),
    /** true quando a ação aconteceu dentro de uma sessão de impersonation. */
    impersonated: integer("impersonated", { mode: "boolean" }).notNull().default(false),
    /** Tenant afetado pela ação (null = ação de plataforma). */
    tenantId: text("tenant_id"),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (table) => [
    index("audit_log_tenant_idx").on(table.tenantId, table.createdAt),
    index("audit_log_actor_idx").on(table.actorUserId, table.createdAt),
    index("audit_log_created_idx").on(table.createdAt),
  ],
);

export type AuditLogRow = typeof auditLog.$inferSelect;
