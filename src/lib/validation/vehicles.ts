import { z } from "zod";
import { BODY_TYPES, FUELS, TRANSMISSIONS, VEHICLE_STATUS } from "@/db/schema";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "Informe a marca").max(60),
  model: z.string().trim().min(1, "Informe o modelo").max(80),
  version: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  yearManufacture: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, `Ano mínimo ${MIN_YEAR}`)
    .max(CURRENT_YEAR + 2),
  yearModel: z.coerce
    .number()
    .int()
    .min(MIN_YEAR, `Ano mínimo ${MIN_YEAR}`)
    .max(CURRENT_YEAR + 2),
  mileageKm: z.coerce.number().int().min(0, "Quilometragem inválida").max(2_000_000),
  priceCents: z.coerce.number().int().min(0).max(100_000_000),
  priceOnRequest: z.boolean().default(false),
  transmission: z.preprocess(emptyToUndefined, z.enum(TRANSMISSIONS).optional()),
  fuel: z.preprocess(emptyToUndefined, z.enum(FUELS).optional()),
  bodyType: z.preprocess(emptyToUndefined, z.enum(BODY_TYPES).optional()),
  color: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  doors: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(6).optional()),
  licensePlateEnd: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(1).regex(/^[0-9]$/, "Informe apenas o último dígito").optional(),
  ),
  options: z.array(z.string().trim().max(60)).max(60).default([]),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional()),
  status: z.enum(VEHICLE_STATUS).default("draft"),
  featured: z.boolean().default(false),
  fipeCode: z.string().trim().max(20).nullable().optional(),
  fipePriceCents: z.number().int().min(0).max(1_000_000_000).nullable().optional(),
  fipeReference: z.string().trim().max(40).nullable().optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const vehicleUpdateSchema = vehicleSchema.partial();

/** Filtros usados tanto no painel quanto no site público. */
export const vehicleFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  status: z.enum(VEHICLE_STATUS).optional(),
  transmission: z.enum(TRANSMISSIONS).optional(),
  fuel: z.enum(FUELS).optional(),
  bodyType: z.enum(BODY_TYPES).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().min(0).optional(),
  yearMin: z.coerce.number().int().min(MIN_YEAR).optional(),
  yearMax: z.coerce.number().int().max(CURRENT_YEAR + 2).optional(),
  kmMax: z.coerce.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  sort: z
    .enum(["recentes", "preco-asc", "preco-desc", "km-asc", "ano-desc"])
    .default("recentes"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

export type VehicleFilters = z.infer<typeof vehicleFiltersSchema>;

export const photoOrderSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1).max(60),
});

export const photoCoverSchema = z.object({
  photoId: z.string().uuid(),
});
