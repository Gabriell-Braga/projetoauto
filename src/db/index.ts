import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import { getBindings } from "@/lib/cloudflare";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

function createDb(d1: D1Database) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return drizzle(d1 as any, { schema });
}

/** Instância Drizzle ligada ao binding D1. Chamar sempre dentro de um handler. */
export async function getDb(): Promise<Database> {
  const { DB } = await getBindings();
  return createDb(DB);
}

export { schema };
