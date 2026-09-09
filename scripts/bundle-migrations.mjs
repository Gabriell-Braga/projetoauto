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

/**
 * A ordem vem do journal do Drizzle, que é quem sabe a sequência correta.
 *
 * Mas o journal só conhece o que o `drizzle-kit generate` criou. Migração
 * escrita à mão — que é como as nossas nascem — não entra nele sozinha, e
 * antes disto ela era simplesmente IGNORADA: o arquivo ficava na pasta, o
 * bundle saía sem ela, o deploy subia, e o banco de produção ficava sem a
 * coluna. Foi o que aconteceu com a migração da placa.
 *
 * Agora sobra é erro. Falhar aqui custa trinta segundos; descobrir em produção
 * custa uma coluna faltando num banco que já está recebendo escrita.
 */
function readOrder() {
  const journalPath = join(MIGRATIONS_DIR, "meta", "_journal.json");
  const naPasta = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (!existsSync(journalPath)) return naPasta;

  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  const noJournal = journal.entries.map((entry) => `${entry.tag}.sql`);

  const fora = naPasta.filter((file) => !noJournal.includes(file));
  if (fora.length > 0) {
    throw new Error(
      `Migração fora do journal, e por isso fora do bundle: ${fora.join(", ")}.\n` +
        `Acrescente uma entrada em ${journalPath} com o mesmo tag (sem .sql).`,
    );
  }

  const sumidas = noJournal.filter((file) => !naPasta.includes(file));
  if (sumidas.length > 0) {
    throw new Error(`Journal cita migração que não existe na pasta: ${sumidas.join(", ")}.`);
  }

  return noJournal;
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
