import { z } from "zod";
import { APPRAISAL_STATUS } from "@/db/schema";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1950;

const emptyToNull = (value: unknown) => (value === "" ? null : value);

/** Um valor em centavos que o formulário manda: inteiro, não negativo, com teto. */
const money = z.number().int().min(0).max(1_000_000_000);

export const appraisalSchema = z.object({
  leadId: z.string().uuid().nullable().optional(),
  customerName: z.string().trim().min(2, "Informe o nome do cliente").max(120),
  customerPhone: z.preprocess(emptyToNull, z.string().trim().max(20).nullable().optional()),
  storeId: z.string().uuid().nullable().optional(),

  brand: z.string().trim().min(1, "Informe a marca").max(60),
  model: z.string().trim().min(1, "Informe o modelo").max(80),
  version: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  yearManufacture: z.coerce.number().int().min(MIN_YEAR, `Ano mínimo ${MIN_YEAR}`).max(CURRENT_YEAR + 2),
  yearModel: z.coerce.number().int().min(MIN_YEAR, `Ano mínimo ${MIN_YEAR}`).max(CURRENT_YEAR + 2),
  mileageKm: z.coerce.number().int().min(0, "Quilometragem inválida").max(2_000_000),
  color: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  licensePlateEnd: z.preprocess(
    emptyToNull,
    z.string().trim().max(1).regex(/^[0-9]$/, "Informe apenas o último dígito").nullable().optional(),
  ),

  fipeCode: z.preprocess(emptyToNull, z.string().trim().max(20).nullable().optional()),
  fipePriceCents: money,
  fipeReference: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),

  conditionCents: money,
  repairsCents: money,
  debtsCents: money,
  /*
   * O único que aceita valor negativo, e por isso não usa `money`: carro de
   * giro rápido vale acima da tabela, e sem essa saída a pessoa inflaria a
   * FIPE para chegar no número que ela sabe estar certo.
   */
  marketAdjustCents: z.number().int().min(-1_000_000_000).max(1_000_000_000),

  offerCents: money,
  targetSaleCents: money,

  status: z.enum(APPRAISAL_STATUS),
  /** Chega como ISO do navegador; o banco guarda timestamp. */
  validUntil: z.preprocess(
    (value) => (value === "" || value === null ? null : value),
    z.coerce.date().nullable().optional(),
  ),
  notes: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()),
});

export const linkVehicleSchema = z.object({ vehicleId: z.string().uuid() });
