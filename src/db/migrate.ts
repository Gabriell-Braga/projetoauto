import { getBindings } from "@/lib/cloudflare";
import { MIGRATIONS } from "./migrations.generated";

const TRACKING_TABLE = `CREATE TABLE IF NOT EXISTS _app_migrations (
  tag TEXT PRIMARY KEY NOT NULL,
  applied_at INTEGER NOT NULL
)`;

/**
 * Erros que significam "esse pedaço já existe".
 *
 * O Webflow Cloud aplica sozinho os .sql do `migrations_dir` no deploy, então
 * quando esta rota roda o schema normalmente já está lá. Reaplicar precisa ser
 * inofensivo — e cada tipo de objeto falha com uma frase diferente.
 */
const ALREADY_APPLIED = [
  /already exists/i,
  /duplicate column/i,
  /duplicate index/i,
];

function isAlreadyApplied(message: string): boolean {
  return ALREADY_APPLIED.some((pattern) => pattern.test(message));
}

export type MigrationReport = {
  applied: string[];
  skipped: string[];
  /** Statements que já existiam e foram ignorados, por migration. */
  tolerated: Record<string, number>;
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

  const report: MigrationReport = { applied: [], skipped: [], tolerated: {} };

  for (const migration of MIGRATIONS) {
    if (alreadyApplied.has(migration.tag)) {
      report.skipped.push(migration.tag);
      continue;
    }

    let tolerated = 0;

    for (const statement of migration.statements) {
      try {
        await DB.prepare(statement).run();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isAlreadyApplied(message)) {
          throw new Error(
            `Migration ${migration.tag} falhou em "${statement.slice(0, 120)}…": ${message}`,
          );
        }
        tolerated += 1;
      }
    }

    await DB.prepare("INSERT INTO _app_migrations (tag, applied_at) VALUES (?, ?)")
      .bind(migration.tag, Date.now())
      .run();

    report.applied.push(migration.tag);
    if (tolerated > 0) report.tolerated[migration.tag] = tolerated;
  }

  return report;
}
