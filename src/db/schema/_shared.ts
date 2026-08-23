import { integer, text } from "drizzle-orm/sqlite-core";

/** Gera um id textual (uuid v4) — disponível no runtime Workers via Web Crypto. */
export const newId = () => crypto.randomUUID();

export const idColumn = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => newId());

export const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date());

export const updatedAt = () =>
  integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());
