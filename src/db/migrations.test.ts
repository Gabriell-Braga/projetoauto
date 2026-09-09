import { describe, expect, it } from "vitest";
import { MIGRATIONS } from "./migrations.generated";

/**
 * O runner executa `DB.prepare(statement).run()` — UM comando por chamada.
 *
 * O D1 recusa um texto com vários comandos, então uma migração escrita à mão
 * com dois `UPDATE` e sem `--> statement-breakpoint` no meio quebra só em
 * produção, na hora de aplicar. Localmente ela passa, porque
 * `wrangler d1 execute --file` aceita arquivo com vários comandos e esconde o
 * problema. Foi assim que a 0016 quase subiu quebrada.
 *
 * Comentário não conta: o SQLite os trata como espaço em branco.
 */
function semComentarios(sql: string): string {
  return sql
    .split("\n")
    .filter((linha) => !linha.trim().startsWith("--"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

describe("migrations embutidas", () => {
  it("cada statement é UM comando só", () => {
    const varios: string[] = [];

    for (const migration of MIGRATIONS) {
      for (const statement of migration.statements) {
        const limpo = semComentarios(statement).trim();
        // o ponto e vírgula final é o do próprio comando
        const corpo = limpo.endsWith(";") ? limpo.slice(0, -1) : limpo;
        if (corpo.includes(";")) varios.push(`${migration.tag}: ${corpo.slice(0, 60)}…`);
      }
    }

    expect(
      varios,
      `Statement com mais de um comando. Separe com "--> statement-breakpoint":\n${varios.join("\n")}`,
    ).toEqual([]);
  });

  it("nenhum statement é só comentário", () => {
    // um bloco de comentário solto viraria prepare("") e derrubaria a migração
    const vazios = MIGRATIONS.flatMap((migration) =>
      migration.statements
        .filter((statement) => semComentarios(statement).trim() === "")
        .map(() => migration.tag),
    );

    expect(vazios).toEqual([]);
  });

  it("as tags não se repetem", () => {
    // duas tags iguais: a segunda nunca roda, porque a primeira já marcou o nome
    const tags = MIGRATIONS.map((migration) => migration.tag);
    expect(new Set(tags).size).toBe(tags.length);
  });
});
