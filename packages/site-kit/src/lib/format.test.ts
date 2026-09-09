import { describe, expect, it } from "vitest";
import { formatPhoneBR } from "./format";

describe("formatPhoneBR", () => {
  it("formata celular de onze digitos", () => {
    expect(formatPhoneBR("31973065499")).toBe("(31) 97306-5499");
  });

  it("formata fixo de dez digitos", () => {
    expect(formatPhoneBR("3135550199")).toBe("(31) 3555-0199");
  });

  it("aceita o que ja veio formatado", () => {
    expect(formatPhoneBR("(31) 3555-0199")).toBe("(31) 3555-0199");
  });

  /*
   * Quem le e brasileiro olhando o telefone de uma loja da cidade dele; o 55
   * so atrapalha. Ele continua onde importa, no link do WhatsApp.
   */
  it("tira o codigo do pais na exibicao", () => {
    expect(formatPhoneBR("5531973065499")).toBe("(31) 97306-5499");
    expect(formatPhoneBR("+55 31 3555-0199")).toBe("(31) 3555-0199");
  });

  it("sem telefone nao ha o que formatar", () => {
    expect(formatPhoneBR(null)).toBeNull();
    expect(formatPhoneBR("")).toBeNull();
    expect(formatPhoneBR("   ")).toBeNull();
  });

  /*
   * Inventar formato em cima de um numero estranho e pior do que mostra-lo do
   * jeito que a revenda escreveu: ela reconhece o proprio erro e corrige.
   */
  it("devolve intacto o que nao reconhece", () => {
    expect(formatPhoneBR("0800 123 4567")).toBe("0800 123 4567");
    expect(formatPhoneBR("123")).toBe("123");
  });
});
