/**
 * Gera src/db/migrations.generated.ts a partir dos arquivos SQL do Drizzle.
 *
 * Motivo: no runtime do Webflow Cloud (Workers) não existe acesso a filesystem,
 * então as migrations precisam ser embutidas no bundle para poderem ser aplicadas
 * no banco remoto via a rota protegida /api/_ops/migrate.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "drizzle";
const OUTPUT = "src/db/migrations.generated.ts";

function readOrder() {
  const journalPath = join(MIGRATIONS_DIR, "meta", "_journal.json");
  if (existsSync(journalPath)) {
    const journal = JSON.parse(readFileSync(journalPath, "utf8"));
    return journal.entries.map((entry) => `${entry.tag}.sql`);
  }
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

const files = readOrder();
const migrations = files.map((file) => {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
  return { tag: file.replace(/\.sql$/, ""), statements };
});

const contents = `// ARQUIVO GERADO AUTOMATICAMENTE — não editar.
// Origem: drizzle/*.sql (rodar \`npm run db:bundle\`).

export type BundledMigration = { tag: string; statements: string[] };

export const MIGRATIONS: BundledMigration[] = ${JSON.stringify(migrations, null, 2)};
`;

writeFileSync(OUTPUT, contents);
console.log(`[db:bundle] ${migrations.length} migration(s) embutida(s) em ${OUTPUT}`);
