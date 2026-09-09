import { describe, expect, it } from "vitest";
import { hoverShade } from "./color";

describe("hoverShade", () => {
  it("escurece a cor da marca", () => {
    const hover = hoverShade("#2563EB");
    expect(hover).not.toBe("#2563eb");
    expect(hover).toMatch(/^#[0-9a-f]{6}$/);
    // continua sendo a mesma cor, so um passo abaixo
    expect(hover).toBe("#2055ca");
  });

  it("clareia quando a cor ja e escura", () => {
    // escurecer preto nao muda pixel nenhum: o botao ficaria sem resposta
    expect(hoverShade("#000000")).toBe("#2e2e2e");
    expect(hoverShade("#111111")).not.toBe("#111111");
  });

  it("aceita a forma curta", () => {
    expect(hoverShade("#fff")).toBe(hoverShade("#ffffff"));
  });

  it("devolve o que nao souber ler", () => {
    expect(hoverShade("rebeccapurple")).toBe("rebeccapurple");
    expect(hoverShade("")).toBe("");
    expect(hoverShade("#12345")).toBe("#12345");
  });

  it("nunca sai da faixa de cor", () => {
    for (const cor of ["#ffffff", "#000000", "#0E7A4B", "#4164F5"]) {
      const hover = hoverShade(cor);
      expect(hover).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
