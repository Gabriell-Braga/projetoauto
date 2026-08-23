import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";

export const TENANT_STATUS = ["active", "suspended", "deleted"] as const;
export type TenantStatus = (typeof TENANT_STATUS)[number];

/** Como o painel da revenda se comporta quando ela está suspensa. */
export const BLOCK_MODES = ["readonly", "full"] as const;
export type BlockMode = (typeof BLOCK_MODES)[number];

export const tenants = sqliteTable(
  "tenants",
  {
    id: idColumn(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    legalName: text("legal_name"),
    cnpj: text("cnpj"),
    status: text("status").$type<TenantStatus>().notNull().default("active"),
    templateId: text("template_id").notNull().default("template-1-clean"),
    blockMode: text("block_mode").$type<BlockMode>().notNull().default("readonly"),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("tenants_slug_unique").on(table.slug),
    index("tenants_status_idx").on(table.status),
  ],
);

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

/** Cores/fontes customizáveis do template — viram CSS variables no site público. */
export type TenantTheme = {
  primary?: string;
  primaryForeground?: string;
  accent?: string;
  surface?: string;
  fontHeading?: string;
  fontBody?: string;
};

export type BusinessHours = {
  /** 0 = domingo … 6 = sábado */
  weekday: number;
  open: string | null;
  close: string | null;
}[];

export type SocialLinks = {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
};

export type SeoSettings = {
  titleTemplate?: string;
  defaultDescription?: string;
  ogImageKey?: string;
};

/** Dados de apresentação/CMS do site — separados de `tenants` para cachear fácil no KV. */
export const tenantSites = sqliteTable("tenant_sites", {
  tenantId: text("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  logoKey: text("logo_key"),
  faviconKey: text("favicon_key"),
  theme: text("theme", { mode: "json" }).$type<TenantTheme>(),
  gtmCode: text("gtm_code"),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  addressStreet: text("address_street"),
  addressNumber: text("address_number"),
  addressComplement: text("address_complement"),
  addressDistrict: text("address_district"),
  addressCity: text("address_city"),
  addressState: text("address_state"),
  addressZip: text("address_zip"),
  mapsUrl: text("maps_url"),
  businessHours: text("business_hours", { mode: "json" }).$type<BusinessHours>(),
  social: text("social", { mode: "json" }).$type<SocialLinks>(),
  aboutTitle: text("about_title"),
  aboutText: text("about_text"),
  seo: text("seo", { mode: "json" }).$type<SeoSettings>(),
  updatedAt: updatedAt(),
});

export type TenantSite = typeof tenantSites.$inferSelect;
export type NewTenantSite = typeof tenantSites.$inferInsert;

export const tenantBanners = sqliteTable(
  "tenant_banners",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    imageKey: text("image_key").notNull(),
    imageKeyMobile: text("image_key_mobile"),
    title: text("title"),
    subtitle: text("subtitle"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    position: integer("position").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
  },
  (table) => [index("tenant_banners_tenant_idx").on(table.tenantId, table.position)],
);

export type TenantBanner = typeof tenantBanners.$inferSelect;
