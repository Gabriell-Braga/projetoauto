import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";

export const BILLING_STATUS = ["adimplente", "inadimplente", "suspenso"] as const;
export type BillingStatus = (typeof BILLING_STATUS)[number];

export const billingStatus = sqliteTable(
  "billing_status",
  {
    tenantId: text("tenant_id")
      .primaryKey()
      .references(() => tenants.id, { onDelete: "cascade" }),
    status: text("status").$type<BillingStatus>().notNull().default("adimplente"),
    /** Dia do mês do vencimento (1-28). */
    dueDay: integer("due_day").notNull().default(10),
    /** Dias de tolerância entre o vencimento e a suspensão automática. */
    graceDays: integer("grace_days").notNull().default(5),
    amountCents: integer("amount_cents").notNull().default(0),
    currentDueDate: integer("current_due_date", { mode: "timestamp_ms" }),
    lastPaymentAt: integer("last_payment_at", { mode: "timestamp_ms" }),
    updatedAt: updatedAt(),
  },
  (table) => [index("billing_status_status_idx").on(table.status)],
);

export type BillingStatusRow = typeof billingStatus.$inferSelect;

export const BILLING_EVENT_TYPES = ["payment", "status_change", "note"] as const;
export type BillingEventType = (typeof BILLING_EVENT_TYPES)[number];

export const billingEvents = sqliteTable(
  "billing_events",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    type: text("type").$type<BillingEventType>().notNull(),
    amountCents: integer("amount_cents"),
    /** Competência no formato YYYY-MM. */
    referenceMonth: text("reference_month"),
    statusFrom: text("status_from").$type<BillingStatus>(),
    statusTo: text("status_to").$type<BillingStatus>(),
    note: text("note"),
    createdByUserId: text("created_by_user_id"),
    createdByEmail: text("created_by_email"),
    createdAt: createdAt(),
  },
  (table) => [index("billing_events_tenant_idx").on(table.tenantId, table.createdAt)],
);

export type BillingEvent = typeof billingEvents.$inferSelect;
