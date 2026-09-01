import { describe, expect, it } from "vitest";
import { parseBrl, priceGapPercent, priceVerdict } from "./fipe";

describe("leitura do valor da FIPE", () => {
  it("entende o formato brasileiro", () => {
    // ponto é milhar e vírgula é decimal; inverter daria preço mil vezes menor
    expect(parseBrl("R$ 48.328,00")).toBe(4_832_800);
    expect(parseBrl("R$ 9.900,00")).toBe(990_000);
  });

  it("lida com valor acima de um milhão", () => {
    expect(parseBrl("R$ 1.250.000,00")).toBe(125_000_000);
  });

  it("aceita centavos quebrados", () => {
    expect(parseBrl("R$ 48.328,50")).toBe(4_832_850);
  });

  it("devolve zero para texto sem número", () => {
    expect(parseBrl("consultar")).toBe(0);
  });
});

describe("distância da referência", () => {
  it("mede quanto o preço pedido passa da FIPE", () => {
    expect(priceGapPercent(11_000_00, 10_000_00)).toBe(10);
    expect(priceGapPercent(9_000_00, 10_000_00)).toBe(-10);
  });

  it("devolve nulo sem referência, nunca zero", () => {
    // zero afirmaria "está na tabela", e isso não se sabe
    expect(priceGapPercent(10_000_00, null)).toBeNull();
    expect(priceGapPercent(10_000_00, 0)).toBeNull();
  });

  it("devolve nulo para preço sob consulta", () => {
    expect(priceGapPercent(0, 10_000_00)).toBeNull();
  });

  it("arredonda para uma casa", () => {
    expect(priceGapPercent(10_333_00, 10_000_00)).toBe(3.3);
  });
});

describe("veredito de preço", () => {
  it("trata diferença pequena como dentro da faixa", () => {
    // FIPE é referência: quilometragem e estado movem o preço legitimamente
    expect(priceVerdict(4)).toBe("na_faixa");
    expect(priceVerdict(-4)).toBe("na_faixa");
    expect(priceVerdict(0)).toBe("na_faixa");
  });

  it("acusa só quando passa da tolerância", () => {
    expect(priceVerdict(5.1)).toBe("acima");
    expect(priceVerdict(-5.1)).toBe("abaixo");
  });

  it("não opina sem referência", () => {
    expect(priceVerdict(null)).toBeNull();
  });
});
