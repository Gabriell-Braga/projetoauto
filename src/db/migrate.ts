import { getBindings } from "@/lib/cloudflare";
import { MIGRATIONS } from "./migrations.generated";

const TRACKING_TABLE = `CREATE TABLE IF NOT EXISTS _app_migrations (
  tag TEXT PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
)`;

export type MigrationReport = {
  applied: string[];
  skipped: string[];
};

/**
 * Aplica as migrations embutidas no bundle no banco D1 atual.
 * Idempotente: o que já foi aplicado é registrado em `_app_migrations`.
 */
export async function runMigrations(): Promise<MigrationReport> {
  const { DB } = await getBindings();
  await DB.prepare(TRACKING_TABLE).run();

  const existing = await DB.prepare("SELECT tag FROM _app_migrations").all<{ tag: string }>();
  const alreadyApplied = new Set((existing.results ?? []).map((row) => row.tag));

  const report: MigrationReport = { applied: [], skipped: [] };

  for (const migration of MIGRATIONS) {
    if (alreadyApplied.has(migration.tag)) {
      report.skipped.push(migration.tag);
      continue;
    }

    for (const statement of migration.statements) {
      try {
        await DB.prepare(statement).run();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // tolera objetos já existentes (banco criado por outro caminho)
        if (!/already exists/i.test(message)) {
          throw new Error(`Migration ${migration.tag} falhou: ${message}`);
        }
      }
    }

    await DB.prepare("INSERT INTO _app_migrations (tag, applied_at) VALUES (?, ?)")
      .bind(migration.tag, Date.now())
      .run();
    report.applied.push(migration.tag);
  }

  return report;
}
