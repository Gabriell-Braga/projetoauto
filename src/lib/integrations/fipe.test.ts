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

describe("separação de modelo e versão da FIPE", () => {
  it("separa na primeira palavra", async () => {
    const { splitFipeModel } = await import("./fipe");
    expect(splitFipeModel("ONIX HATCH LT 1.0 12V Flex 5p Mec.")).toEqual({
      model: "ONIX",
      version: "HATCH LT 1.0 12V Flex 5p Mec.",
    });
  });

  it("nunca perde informação: junta de volta igual ao original", async () => {
    const { joinFipeModel, splitFipeModel } = await import("./fipe");
    const nomes = [
      "ONIX HATCH LT 1.0 12V Flex 5p Mec.",
      "GRAND SIENA ATTRACTIVE 1.4 Flex 8V",
      "500 Cabrio Dualogic Flex 1.4 8V",
      "Fusca",
    ];
    for (const nome of nomes) {
      const { model, version } = splitFipeModel(nome);
      expect(joinFipeModel(model, version)).toBe(nome);
    }
  });

  it("modelo de uma palavra fica sem versão", async () => {
    const { splitFipeModel } = await import("./fipe");
    expect(splitFipeModel("Fusca")).toEqual({ model: "Fusca", version: "" });
  });

  it("normaliza espaços repetidos", async () => {
    const { splitFipeModel } = await import("./fipe");
    expect(splitFipeModel("  ONIX   LT 1.0  ")).toEqual({ model: "ONIX", version: "LT 1.0" });
  });

  it("junta ignorando campo vazio", async () => {
    const { joinFipeModel } = await import("./fipe");
    expect(joinFipeModel("ONIX", "")).toBe("ONIX");
    expect(joinFipeModel("", "LT 1.0")).toBe("LT 1.0");
  });
});

describe("ano zero-quilômetro da FIPE", () => {
  it("traduz 32000 para o ano corrente", async () => {
    const { normalizeFipeYear } = await import("./fipe");
    // 32000 e o campo do formulario recusa; o carro e novo, nao de outro milenio
    expect(normalizeFipeYear(32000, 2026)).toBe(2026);
  });

  it("deixa ano normal intacto", async () => {
    const { normalizeFipeYear } = await import("./fipe");
    expect(normalizeFipeYear(2022, 2026)).toBe(2022);
    expect(normalizeFipeYear(1998, 2026)).toBe(1998);
  });

  it("reconhece o zero-km", async () => {
    const { isZeroKm } = await import("./fipe");
    expect(isZeroKm(32000)).toBe(true);
    expect(isZeroKm(2026)).toBe(false);
  });
});

describe("rótulo do ano na lista", () => {
  it("traduz o código 32000 para zero km", async () => {
    const { formatFipeYearLabel } = await import("./fipe");
    // "32000 Flex" na lista lê como um ano absurdo
    expect(formatFipeYearLabel("32000 Flex")).toBe("Zero km · Flex");
  });

  it("deixa ano normal como está", async () => {
    const { formatFipeYearLabel } = await import("./fipe");
    expect(formatFipeYearLabel("2026 Flex")).toBe("2026 Flex");
    expect(formatFipeYearLabel("1998 Gasolina")).toBe("1998 Gasolina");
  });

  it("aguenta zero km sem combustível informado", async () => {
    const { formatFipeYearLabel } = await import("./fipe");
    expect(formatFipeYearLabel("32000")).toBe("Zero km");
  });
});
