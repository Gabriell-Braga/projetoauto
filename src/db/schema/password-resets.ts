import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createdAt, idColumn } from "./_shared";
import { users } from "./users";

/**
 * Pedido de redefinição de senha.
 * O token nunca é guardado em claro — só o SHA-256 dele. Quem tem o link
 * tem o segredo; o banco sozinho não permite assumir a conta.
 */
export const passwordResets = sqliteTable(
  "password_resets",
  {
    id: idColumn(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    /** false quando não há provedor de e-mail configurado e o link precisa ser entregue à mão. */
    delivered: integer("delivered", { mode: "boolean" }).notNull().default(false),
    requestedIp: text("requested_ip"),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("password_resets_token_unique").on(table.tokenHash),
    index("password_resets_user_idx").on(table.userId, table.createdAt),
    index("password_resets_expires_idx").on(table.expiresAt),
  ],
);

export type PasswordReset = typeof passwordResets.$inferSelect;
