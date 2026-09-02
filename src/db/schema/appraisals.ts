import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";
import { users } from "./users";
import { leads } from "./leads";

/**
 * Como a avaliação termina.
 *
 * `rascunho` é conta em andamento — ninguém falou com o cliente ainda.
 * `enviada` é oferta feita, e é dela que nasce o prazo de validade: preço de
 * carro usado envelhece, e uma proposta de três semanas atrás não vale mais.
 */
export const APPRAISAL_STATUS = [
  "rascunho",
  "enviada",
  "aceita",
  "recusada",
  "expirada",
] as const;
export type AppraisalStatus = (typeof APPRAISAL_STATUS)[number];

/**
 * Avaliação de um veículo que a revenda pensa em comprar.
 *
 * É a conta que hoje acontece de cabeça: o vendedor olha a FIPE no celular,
 * desconta o que achar dos pneus e da lataria e diz um número. O número sai
 * diferente conforme quem atende, ninguém sabe explicar como chegou nele, e
 * quando o carro entra no estoque já se perdeu quanto ele custou.
 *
 * Aqui a conta fica escrita. A referência da FIPE é o ponto de partida, cada
 * desconto tem uma linha, e o valor sugerido é derivado — nunca digitado. O
 * que o vendedor de fato ofereceu fica ao lado, num campo próprio: a diferença
 * entre os dois é a informação que interessa ao dono da revenda.
 *
 * Nada aqui é uma promessa ao cliente: `validUntil` é o prazo que a própria
 * revenda dá à oferta.
 */
export const vehicleAppraisals = sqliteTable(
  "vehicle_appraisals",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /* ---------------------------------------------------- quem trouxe o carro */
    leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone"),
    storeId: text("store_id"),

    /* ------------------------------------------------------------- o veículo */
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    version: text("version"),
    yearManufacture: integer("year_manufacture").notNull().default(0),
    yearModel: integer("year_model").notNull().default(0),
    mileageKm: integer("mileage_km").notNull().default(0),
    color: text("color"),
    licensePlateEnd: text("license_plate_end"),

    /* ------------------------------------- referência da FIPE, como consultada */
    fipeCode: text("fipe_code"),
    fipePriceCents: integer("fipe_price_cents").notNull().default(0),
    fipeReference: text("fipe_reference"),

    /*
     * Descontos, um por motivo.
     *
     * Separados em vez de um abatimento único porque é o que a pessoa precisa
     * mostrar ao cliente: "tirei tanto de pneu e tanto de IPVA atrasado" se
     * defende; "tirei oito mil" vira discussão.
     *
     * `marketAdjustCents` é o único que aceita valor negativo — carro de giro
     * rápido às vezes vale mais que a tabela, e forçar tudo para baixo faria a
     * pessoa mentir em outro campo para chegar no número certo.
     */
    conditionCents: integer("condition_cents").notNull().default(0),
    repairsCents: integer("repairs_cents").notNull().default(0),
    debtsCents: integer("debts_cents").notNull().default(0),
    marketAdjustCents: integer("market_adjust_cents").notNull().default(0),

    /*
     * `suggestedCents` é derivado no servidor a cada gravação — a conta não
     * pode depender de o navegador ter feito a soma certa.
     *
     * `offerCents` é a decisão de quem atendeu. Guardar os dois é o que permite
     * perguntar depois por que se ofereceu acima do sugerido, e para quem.
     */
    suggestedCents: integer("suggested_cents").notNull().default(0),
    offerCents: integer("offer_cents").notNull().default(0),
    targetSaleCents: integer("target_sale_cents").notNull().default(0),

    status: text("status").$type<AppraisalStatus>().notNull().default("rascunho"),
    validUntil: integer("valid_until", { mode: "timestamp_ms" }),
    notes: text("notes"),

    /** Preenchido quando a avaliação vira ficha no estoque. */
    vehicleId: text("vehicle_id"),

    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("vehicle_appraisals_tenant_status_idx").on(
      table.tenantId,
      table.status,
      table.createdAt,
    ),
    index("vehicle_appraisals_lead_idx").on(table.leadId),
  ],
);

export type VehicleAppraisal = typeof vehicleAppraisals.$inferSelect;
