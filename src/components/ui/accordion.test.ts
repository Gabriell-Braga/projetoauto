import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * O accordion guarda campos de formulário.
 *
 * Trocar `hidden={!open}` por renderização condicional (`{open && ...}`) parece
 * uma limpeza inofensiva e destrói dados: React desmonta os campos, o estado
 * some, e quem recolheu uma seção depois de preenchê-la perde o que digitou
 * sem nenhum aviso. O defeito não aparece em teste de tela nem em revisão.
 */
const source = readFileSync(
  join(process.cwd(), "src/components/ui/accordion.tsx"),
  "utf8",
);

describe("contrato do accordion", () => {
  it("esconde com hidden, não desmonta o conteúdo", () => {
    expect(source).toContain("hidden={!open}");
    expect(source).not.toMatch(/\{open\s*&&/);
  });

  it("anuncia o estado para leitores de tela", () => {
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls=");
  });

  it("o cabeçalho é um botão de verdade, não uma div clicável", () => {
    // div com onClick não recebe foco por teclado nem responde a Enter
    expect(source).toMatch(/<button\s+type="button"/);
  });

  it("mostra o resumo quando está fechado", () => {
    // seção fechada sem resumo esconde trabalho: a pessoa só descobre o que
    // faltava na hora de salvar
    expect(source).toContain("!open && summary");
  });
});
