import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";

export const VEHICLE_STATUS = ["draft", "available", "reserved", "sold"] as const;
export type VehicleStatus = (typeof VEHICLE_STATUS)[number];

export const TRANSMISSIONS = ["manual", "automatico", "automatizado", "cvt"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const FUELS = ["flex", "gasolina", "etanol", "diesel", "gnv", "hibrido", "eletrico"] as const;
export type Fuel = (typeof FUELS)[number];

export const BODY_TYPES = [
  "hatch",
  "sedan",
  "suv",
  "picape",
  "minivan",
  "cupe",
  "conversivel",
  "utilitario",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const vehicles = sqliteTable(
  "vehicles",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    version: text("version"),
    yearManufacture: integer("year_manufacture").notNull(),
    yearModel: integer("year_model").notNull(),
    mileageKm: integer("mileage_km").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    priceOnRequest: integer("price_on_request", { mode: "boolean" }).notNull().default(false),
    transmission: text("transmission").$type<Transmission>(),
    fuel: text("fuel").$type<Fuel>(),
    bodyType: text("body_type").$type<BodyType>(),
    color: text("color"),
    doors: integer("doors"),
    licensePlateEnd: text("license_plate_end"),
    /** Lista de opcionais (chaves do catálogo em src/lib/catalog/options.ts). */
    options: text("options", { mode: "json" }).$type<string[]>(),
    description: text("description"),
    /** Unidade dona do carro; nulo em revenda de uma loja só. */
    storeId: text("store_id"),
    status: text("status").$type<VehicleStatus>().notNull().default("draft"),
    /**
     * Rascunho provisório: existe só para as fotos terem onde morar enquanto a
     * ficha ainda não foi salva. Preenchido na criação e zerado no primeiro
     * salvamento — a faxina apaga o que passar da validade, e rascunho que a
     * pessoa guardou de propósito tem isto nulo e nunca é tocado.
     */
    draftExpiresAt: integer("draft_expires_at", { mode: "timestamp_ms" }),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    views: integer("views").notNull().default(0),
    coverPhotoKey: text("cover_photo_key"),
    photosCount: integer("photos_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("vehicles_tenant_slug_unique").on(table.tenantId, table.slug),
    index("vehicles_tenant_status_idx").on(table.tenantId, table.status),
    index("vehicles_tenant_featured_idx").on(table.tenantId, table.featured, table.status),
    index("vehicles_tenant_brand_idx").on(table.tenantId, table.brand, table.model),
    index("vehicles_tenant_price_idx").on(table.tenantId, table.priceCents),
    index("vehicles_tenant_created_idx").on(table.tenantId, table.createdAt),
  ],
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

/** Chaves das 3 variantes geradas no browser durante o upload. */
export type PhotoVariants = {
  thumb: string;
  card: string;
  full: string;
};

export const vehiclePhotos = sqliteTable(
  "vehicle_photos",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    vehicleId: text("vehicle_id")
      .notNull()
      .references(() => vehicles.id, { onDelete: "cascade" }),
    variants: text("variants", { mode: "json" }).$type<PhotoVariants>().notNull(),
    width: integer("width"),
    height: integer("height"),
    sizeBytes: integer("size_bytes"),
    position: integer("position").notNull().default(0),
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    index("vehicle_photos_vehicle_idx").on(table.vehicleId, table.position),
    index("vehicle_photos_tenant_idx").on(table.tenantId),
  ],
);

export type VehiclePhoto = typeof vehiclePhotos.$inferSelect;

/** Catálogo curado de marcas/modelos (global, com possibilidade de item criado por tenant). */
export const vehicleBrands = sqliteTable(
  "vehicle_brands",
  {
    id: idColumn(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdByTenantId: text("created_by_tenant_id"),
  },
  (table) => [uniqueIndex("vehicle_brands_slug_unique").on(table.slug)],
);

export const vehicleModels = sqliteTable(
  "vehicle_models",
  {
    id: idColumn(),
    brandId: text("brand_id")
      .notNull()
      .references(() => vehicleBrands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdByTenantId: text("created_by_tenant_id"),
  },
  (table) => [uniqueIndex("vehicle_models_brand_slug_unique").on(table.brandId, table.slug)],
);
