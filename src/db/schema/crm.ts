import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";
import { users } from "./users";
import { leads } from "./leads";

/* ------------------------------------------------------------------------ */
/* Funil comercial                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Como a etapa encerra o funil.
 *
 * `open` é etapa de trabalho; `won` e `lost` fecham. A separação existe para o
 * relatório saber o que é conversão sem depender do nome que a revenda deu à
 * etapa — cada uma batiza do seu jeito.
 */
export const STAGE_KINDS = ["open", "won", "lost"] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const pipelineStages = sqliteTable(
  "pipeline_stages",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: text("kind").$type<StageKind>().notNull().default("open"),
    position: integer("position").notNull().default(0),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("pipeline_stages_tenant_idx").on(table.tenantId, table.position)],
);

export type PipelineStage = typeof pipelineStages.$inferSelect;

/* ------------------------------------------------------------------------ */
/* Histórico do lead                                                         */
/* ------------------------------------------------------------------------ */

export const LEAD_EVENT_TYPES = [
  "note",
  "call",
  "whatsapp",
  "email",
  "visit",
  "proposal",
  "stage_change",
  "assignment",
  "status_change",
  "created",
] as const;
export type LeadEventType = (typeof LEAD_EVENT_TYPES)[number];

/**
 * Linha do tempo do lead: conversas registradas e mudanças automáticas.
 *
 * Contato e movimentação moram na mesma tabela de propósito. Quem atende
 * precisa ler "liguei, pediu para retornar amanhã" e "mudou para Negociação"
 * na mesma sequência — separar em duas telas obriga a pessoa a remontar a
 * ordem dos fatos de cabeça.
 */
export const leadEvents = sqliteTable(
  "lead_events",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: text("type").$type<LeadEventType>().notNull().default("note"),
    body: text("body"),
    /** Quem fez; nulo quando foi o sistema. */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    /** Nome de quem fez, congelado — sobrevive à exclusão do usuário. */
    userName: text("user_name"),
    /**
     * Quem falou: `in` é o cliente, `out` somos nós, nulo é evento do sistema.
     *
     * Coluna própria, não um campo dentro do metadata, porque é o que decide
     * se a janela de 24 horas do WhatsApp está aberta — e isso precisa ser
     * consultável por índice, não por leitura de JSON.
     */
    direction: text("direction").$type<"in" | "out">(),
    /** Id da mensagem no provedor, para não registrar a mesma duas vezes. */
    externalId: text("external_id"),
    metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (table) => [
    index("lead_events_lead_idx").on(table.leadId, table.createdAt),
    index("lead_events_direction_idx").on(table.leadId, table.direction, table.createdAt),
  ],
);

export type LeadEvent = typeof leadEvents.$inferSelect;

/* ------------------------------------------------------------------------ */
/* Distribuição automática                                                   */
/* ------------------------------------------------------------------------ */

export const DISTRIBUTION_MODES = ["off", "round_robin", "by_store"] as const;
export type DistributionMode = (typeof DISTRIBUTION_MODES)[number];

/**
 * Regra de rodízio dos leads, uma linha por revenda.
 *
 * `lastAssignedUserId` é o ponteiro do rodízio: guarda quem recebeu por
 * último para o próximo sair do seguinte. Sem ponteiro persistido, cada
 * requisição recomeçaria do primeiro da fila e o primeiro vendedor da lista
 * receberia tudo.
 */
export const leadRouting = sqliteTable("lead_routing", {
  tenantId: text("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  mode: text("mode").$type<DistributionMode>().notNull().default("off"),
  lastAssignedUserId: text("last_assigned_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: updatedAt(),
});

export type LeadRouting = typeof leadRouting.$inferSelect;

/* ------------------------------------------------------------------------ */
/* Financiamentos                                                            */
/* ------------------------------------------------------------------------ */

export const FINANCING_STATUS = [
  "rascunho",
  "em_analise",
  "aprovado",
  "recusado",
  "contratado",
  "cancelado",
] as const;
export type FinancingStatus = (typeof FINANCING_STATUS)[number];

/**
 * Proposta de financiamento acompanhada pela revenda.
 *
 * Não fala com banco nenhum: é o controle do que foi enviado, para quem, e em
 * que pé está. É assim que a revenda opera hoje — planilha ou WhatsApp — e o
 * ganho está em ficar junto do lead e do veículo, não em automatizar o banco.
 */
export const financings = sqliteTable(
  "financings",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: text("lead_id").references(() => leads.id, { onDelete: "set null" }),
    vehicleId: text("vehicle_id"),
    vehicleLabel: text("vehicle_label"),
    customerName: text("customer_name").notNull(),
    customerDocument: text("customer_document"),
    customerPhone: text("customer_phone"),
    bank: text("bank"),
    vehiclePriceCents: integer("vehicle_price_cents").notNull().default(0),
    downPaymentCents: integer("down_payment_cents").notNull().default(0),
    financedCents: integer("financed_cents").notNull().default(0),
    installments: integer("installments").notNull().default(0),
    installmentCents: integer("installment_cents").notNull().default(0),
    status: text("status").$type<FinancingStatus>().notNull().default("rascunho"),
    notes: text("notes"),
    storeId: text("store_id"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    decidedAt: integer("decided_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("financings_tenant_status_idx").on(table.tenantId, table.status, table.createdAt),
    index("financings_lead_idx").on(table.leadId),
  ],
);

export type Financing = typeof financings.$inferSelect;

/* ------------------------------------------------------------------------ */
/* API e webhooks da revenda                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Chave de API da revenda.
 *
 * Guardamos só o hash — a chave em claro aparece uma única vez, na criação.
 * `prefix` são os primeiros caracteres, em claro, para a pessoa reconhecer
 * qual chave é qual na lista sem que isso ajude ninguém a adivinhar o resto.
 */
export const apiKeys = sqliteTable(
  "api_keys",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    prefix: text("prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("api_keys_hash_unique").on(table.keyHash),
    index("api_keys_tenant_idx").on(table.tenantId, table.revokedAt),
  ],
);

export type ApiKey = typeof apiKeys.$inferSelect;

export const TENANT_WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "vehicle.created",
  "vehicle.updated",
  "vehicle.sold",
] as const;
export type TenantWebhookEvent = (typeof TENANT_WEBHOOK_EVENTS)[number];

/**
 * Webhook de saída da revenda.
 *
 * Assinado com HMAC-SHA256 no header — diferente do webhook do Asaas, que
 * chega com token estático. Aqui somos nós quem chamamos, então dá para fazer
 * do jeito certo e provar que a chamada partiu daqui.
 */
export const tenantWebhooks = sqliteTable(
  "tenant_webhooks",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    secret: text("secret").notNull(),
    events: text("events", { mode: "json" }).$type<string[]>(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    lastStatus: integer("last_status"),
    lastError: text("last_error"),
    lastAttemptAt: integer("last_attempt_at", { mode: "timestamp_ms" }),
    failureCount: integer("failure_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("tenant_webhooks_tenant_idx").on(table.tenantId, table.active)],
);

export type TenantWebhook = typeof tenantWebhooks.$inferSelect;

/* ------------------------------------------------------------------------ */
/* Modelos de mensagem                                                       */
/* ------------------------------------------------------------------------ */

export const MESSAGE_CHANNELS = ["whatsapp", "email"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

/**
 * Mensagem pronta que o vendedor dispara para o cliente.
 *
 * Existe independente de provedor: hoje o texto abre o WhatsApp do aparelho
 * com a mensagem já escrita, o que funciona sem contrato nenhum. Quando houver
 * API oficial, o mesmo modelo passa a ser enviado por ela — o que a revenda
 * escreveu continua valendo.
 */
export const messageTemplates = sqliteTable(
  "message_templates",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    channel: text("channel").$type<MessageChannel>().notNull().default("whatsapp"),
    body: text("body").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("message_templates_tenant_idx").on(table.tenantId, table.channel, table.sortOrder),
  ],
);

export type MessageTemplate = typeof messageTemplates.$inferSelect;


/* ------------------------------------------------------------------------ */
/* WhatsApp oficial                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Conta de WhatsApp Business da revenda.
 *
 * Uma por revenda, e o número é dela — não nosso. O cliente precisa ver o
 * telefone da loja com quem já falou, não um número genérico da plataforma;
 * e a resposta dele tem que chegar em quem vende, não em nós.
 *
 * O token vive no cofre: é credencial de terceiro e precisamos do valor
 * original para chamar a API da Meta.
 */
export const whatsappConnections = sqliteTable(
  "whatsapp_connections",
  {
    tenantId: text("tenant_id")
      .primaryKey()
      .references(() => tenants.id, { onDelete: "cascade" }),
    phoneNumberId: text("phone_number_id").notNull(),
    wabaId: text("waba_id"),
    /** Número como o cliente o vê, só para exibição. */
    displayPhone: text("display_phone"),
    credentials: text("credentials").notNull(),
    status: text("status").notNull().default("conectado"),
    lastError: text("last_error"),
    lastInboundAt: integer("last_inbound_at", { mode: "timestamp_ms" }),
    connectedByUserId: text("connected_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [uniqueIndex("whatsapp_phone_number_unique").on(table.phoneNumberId)],
);

export type WhatsappConnection = typeof whatsappConnections.$inferSelect;
