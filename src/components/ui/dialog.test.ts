import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DIALOG_LAYOUT } from "./dialog";

/**
 * Um formulário longo dentro do diálogo cresceu além da tela e empurrou o
 * cabeçalho e o rodapé para fora: a pessoa ficou sem o título e sem o botão de
 * salvar, e nada na interface avisava. O teste trava as três peças que impedem
 * isso — teto de altura, painel em coluna e corpo rolável — porque a falha é
 * invisível em revisão de código e só aparece com conteúdo grande.
 */
describe("contrato de layout do diálogo", () => {
  it("limita a altura do painel à viewport", () => {
    expect(DIALOG_LAYOUT.panel).toMatch(/max-h-\[/);
  });

  it("empilha o painel em coluna, para cabeçalho e rodapé terem lugar fixo", () => {
    expect(DIALOG_LAYOUT.panel).toContain("flex");
    expect(DIALOG_LAYOUT.panel).toContain("flex-col");
  });

  it("rola o corpo, não a página", () => {
    expect(DIALOG_LAYOUT.body).toContain("overflow-y-auto");
    // sem min-h-0 o filho flex se recusa a encolher e o overflow nunca ativa
    expect(DIALOG_LAYOUT.body).toContain("min-h-0");
    expect(DIALOG_LAYOUT.body).toContain("flex-1");
  });

  it("impede cabeçalho e rodapé de encolherem", () => {
    expect(DIALOG_LAYOUT.header).toContain("shrink-0");
    expect(DIALOG_LAYOUT.footer).toContain("shrink-0");
  });

  it("aplica o contrato no componente, não só na constante", () => {
    const source = readFileSync(join(process.cwd(), "src/components/ui/dialog.tsx"), "utf8");
    for (const part of ["panel", "header", "body", "footer"] as const) {
      expect(source).toContain(`DIALOG_LAYOUT.${part}`);
    }
  });
});
