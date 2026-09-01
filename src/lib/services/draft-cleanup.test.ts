import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DRAFT_TTL_MS } from "./draft-cleanup";

/**
 * A faxina roda sozinha, sem ninguém olhando, e apaga veículo e foto de
 * verdade. O que ela apaga depende de uma cláusula SQL que precisa de banco
 * para ser exercitada — então o que dá para travar aqui é a presença das duas
 * salvaguardas, cuja remoção seria destrutiva e silenciosa:
 *
 *  - sem o filtro de "tem validade preenchida", a varredura pega TODO veículo
 *    cujo campo é nulo, isto é, todo veículo salvo da plataforma;
 *  - sem zerar a validade ao salvar, o veículo que a pessoa acabou de cadastrar
 *    continua marcado como provisório e é apagado horas depois.
 *
 * Nenhuma das duas aparece como erro em teste de tela: some estoque, e ninguém
 * liga a perda à faxina.
 */
function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("salvaguardas da faxina de rascunhos", () => {
  it("só varre linha com validade preenchida", () => {
    const cleanup = source("src/lib/services/draft-cleanup.ts");
    expect(cleanup).toContain("isNotNull(vehicles.draftExpiresAt)");
    expect(cleanup).toContain("lt(vehicles.draftExpiresAt, now)");
  });

  it("salvar a ficha tira o veículo da varredura", () => {
    const patch = source("src/app/api/admin/vehicles/[id]/route.ts");
    expect(patch).toContain("draftExpiresAt: null");
  });

  it("dá folga suficiente para um cadastro demorado", () => {
    // trinta fotos em conexão ruim não podem ser varridas embaixo de quem envia
    expect(DRAFT_TTL_MS).toBeGreaterThanOrEqual(2 * 60 * 60 * 1000);
  });
});
