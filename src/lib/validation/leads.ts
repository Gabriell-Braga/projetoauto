import { z } from "zod";
import { LEAD_STATUS } from "@/db/schema";
import { onlyDigits } from "@/lib/utils";

export const publicLeadSchema = z.object({
  tenantSlug: z.string().trim().min(1),
  vehicleId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  phone: z
    .string()
    .trim()
    .min(10, "Informe um telefone válido com DDD")
    .max(20)
    .refine((value) => onlyDigits(value).length >= 10, "Informe um telefone válido com DDD"),
  email: z.string().trim().toLowerCase().email("E-mail inválido").optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional(),
  /** Honeypot: preenchido só por bot. Aceita qualquer valor para não dar pista;
   *  o descarte acontece no handler. */
  website: z.string().max(200).optional(),
  utm: z
    .object({
      source: z.string().max(120).optional(),
      medium: z.string().max(120).optional(),
      campaign: z.string().max(120).optional(),
      term: z.string().max(120).optional(),
      content: z.string().max(120).optional(),
      referrer: z.string().max(500).optional(),
      page: z.string().max(500).optional(),
    })
    .optional(),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUS).optional(),
  /** Etapa do funil; null tira o lead do quadro sem apagá-lo. */
  stageId: z.string().uuid().nullable().optional(),
  storeId: z.string().uuid().nullable().optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

export const leadEventSchema = z.object({
  type: z.enum(["note", "call", "whatsapp", "email", "visit", "proposal"]),
  body: z.string().trim().min(1, "Escreva o que aconteceu").max(4000),
});
