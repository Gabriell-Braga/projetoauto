import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Corpo de card montado à mão cola na borda do cabeçalho.
 *
 * `CardHeader` termina numa borda e `CardContent` já traz `px-4 py-4`. Escrever
 * `px-4 pb-4` num div — sem o topo — encosta o conteúdo na linha divisória, e o
 * defeito é discreto o bastante para passar batido em revisão: o print parece
 * apenas "apertado", não errado. Aconteceu três vezes, então virou teste.
 */
const FORBIDDEN = [
  { pattern: /className="[^"]*\bpx-4 pb-4\b/, hint: 'px-4 pb-4' },
  { pattern: /className="[^"]*\bpb-4 px-4\b/, hint: 'pb-4 px-4' },
];

function tsxFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...tsxFiles(path));
    } else if (entry.endsWith(".tsx")) {
      found.push(path);
    }
  }
  return found;
}

describe("espaçamento de card", () => {
  it("não monta corpo de card na mão — use CardContent", () => {
    const offenders: string[] = [];

    for (const file of tsxFiles(join(process.cwd(), "src"))) {
      const source = readFileSync(file, "utf8");
      source.split("\n").forEach((line, index) => {
        for (const { pattern, hint } of FORBIDDEN) {
          if (pattern.test(line)) {
            offenders.push(`${file.replace(process.cwd(), "").slice(1)}:${index + 1} — ${hint}`);
          }
        }
      });
    }

    expect(
      offenders,
      `Padding de card escrito à mão fica sem espaço no topo e encosta na borda do cabeçalho. Troque o div por <CardContent>:\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
