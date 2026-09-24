import { index, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";
import { users } from "./users";
import { vehicles } from "./vehicles";

export const LEAD_STATUS = ["new", "in_progress", "won", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const LEAD_SOURCES = ["form", "whatsapp", "phone", "manual", "portal"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export type LeadUtm = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  page?: string;
};

export const leads = sqliteTable(
  "leads",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    /** Snapshot do veículo no momento do lead (sobrevive à exclusão do anúncio). */
    vehicleLabel: text("vehicle_label"),
    name: text("name").notNull(),
    /**
     * Pode chegar vazio: lead de portal de classificados não traz telefone.
     * O Mercado Livre entrega a pergunta e o apelido de quem perguntou, e mais
     * nada — a conversa continua lá até a pessoa passar o contato. A coluna
     * segue NOT NULL porque trocar isso no SQLite exige reconstruir a tabela;
     * quem lê trata vazio como ausente (`formatPhone` já mostra "—").
     */
    phone: text("phone").notNull(),
    email: text("email"),
    message: text("message"),
    source: text("source").$type<LeadSource>().notNull().default("form"),
    status: text("status").$type<LeadStatus>().notNull().default("new"),
    /** Etapa do funil. Nulo enquanto a revenda não montar o funil dela. */
    stageId: text("stage_id"),
    storeId: text("store_id"),
    assignedToUserId: text("assigned_to_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    internalNotes: text("internal_notes"),
    /**
     * Identidade do lead na origem, quando ele não nasceu aqui.
     * No Mercado Livre é `mercadolivre:<anúncio>:<comprador>`: a segunda
     * pergunta da mesma pessoa sobre o mesmo carro vira evento no lead que já
     * existe, e não um lead novo para a equipe atender duas vezes.
     */
    externalId: text("external_id"),
    utm: text("utm", { mode: "json" }).$type<LeadUtm>(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("leads_tenant_status_idx").on(table.tenantId, table.status, table.createdAt),
    index("leads_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("leads_vehicle_idx").on(table.vehicleId),
    index("leads_external_idx").on(table.tenantId, table.externalId),
  ],
);

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
