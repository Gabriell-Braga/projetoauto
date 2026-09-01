import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";

/**
 * Unidade física da revenda.
 *
 * Antes uma revenda era uma loja só, com endereço e telefone guardados no
 * cadastro do site. A loja vira entidade própria para que estoque, pessoas e
 * leads possam pertencer a uma unidade — sem isso, rede com três pátios vê
 * tudo misturado e não consegue medir nada por unidade.
 *
 * `storeId` é opcional em todo lugar de propósito: revenda de uma loja só
 * continua funcionando sem nunca ouvir falar em unidade.
 */
export const stores = sqliteTable(
  "stores",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    whatsapp: text("whatsapp"),
    phone: text("phone"),
    email: text("email"),
    addressZip: text("address_zip"),
    addressStreet: text("address_street"),
    addressNumber: text("address_number"),
    addressComplement: text("address_complement"),
    addressDistrict: text("address_district"),
    addressCity: text("address_city"),
    addressState: text("address_state"),
    /** Recebe o que não tem unidade escolhida. */
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("stores_tenant_slug_unique").on(table.tenantId, table.slug),
    index("stores_tenant_active_idx").on(table.tenantId, table.active, table.sortOrder),
  ],
);

export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
