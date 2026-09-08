import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn, updatedAt } from "./_shared";
import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Estado do domínio, do ponto de vista de quem está esperando o site subir.
 *
 * Três, e não os sete que a Vercel distingue: para a revenda só existe "ainda
 * não", "no ar" e "deu ruim". A explicação fina do que falta vive em
 * `pendingRecords` e `lastError`, que são texto para ler, não estado para
 * programar em cima.
 */
export const DOMAIN_STATUS = ["pendente", "ativo", "erro"] as const;
export type DomainStatus = (typeof DOMAIN_STATUS)[number];

/** Registro de DNS que a revenda precisa criar, como a Vercel pede. */
export type DnsRecord = {
  type: "A" | "CNAME" | "TXT";
  /** Nome do registro no painel de DNS. "@" é a raiz do domínio. */
  name: string;
  value: string;
};

/**
 * Domínio pelo qual o site de uma revenda responde.
 *
 * Cada revenda usa o domínio dela — não há subdomínio nosso no meio. Isso tira
 * do caminho o certificado wildcard, os nameservers apontados para a Vercel e
 * a entrada na Public Suffix List: domínios de donos diferentes já são sites
 * diferentes para o navegador, sem que a gente precise provar isso a ninguém.
 * O painel continua onde está, em outro domínio, e o cookie de sessão dele não
 * alcança site de revenda nenhum.
 *
 * A tabela mora no painel, mas quem serve o site é outro app, em outra
 * hospedagem. Ela é a fonte da verdade de "este domínio é desta revenda" — o
 * app dos sites resolve a revenda pelo `Host` da requisição consultando isto.
 *
 * `domain` é único no sistema inteiro, não por revenda: um mesmo endereço não
 * pode apontar para duas lojas, e deixar o banco recusar é melhor que
 * descobrir servindo a página errada para o cliente errado.
 */
export const tenantDomains = sqliteTable(
  "tenant_domains",
  {
    id: idColumn(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    /** Sempre minúsculo e sem protocolo — normalizado antes de chegar aqui. */
    domain: text("domain").notNull(),
    status: text("status").$type<DomainStatus>().notNull().default("pendente"),
    /**
     * O endereço que o site anuncia como oficial.
     *
     * Existe porque a mesma revenda costuma cadastrar dois: o domínio e o
     * `www`. Sem eleger um, o canonical do SEO e os links do WhatsApp sairiam
     * sorteando entre eles, e o Google trataria como conteúdo duplicado.
     */
    isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
    /** Registros que ainda faltam criar no DNS, como a Vercel os descreve. */
    pendingRecords: text("pending_records", { mode: "json" }).$type<DnsRecord[]>(),
    lastError: text("last_error"),
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("tenant_domains_domain_unique").on(table.domain),
    index("tenant_domains_tenant_idx").on(table.tenantId, table.isPrimary),
  ],
);

export type TenantDomain = typeof tenantDomains.$inferSelect;
