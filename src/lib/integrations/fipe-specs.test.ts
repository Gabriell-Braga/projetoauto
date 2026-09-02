import { describe, expect, it } from "vitest";
import {
  inferBodyType,
  inferDoors,
  inferFuel,
  inferSpecs,
  inferTransmission,
} from "./fipe-specs";

/** Nomes reais, como a FIPE devolve. */
const REAIS = {
  onix: "ONIX HATCH LT 1.0 12V Flex 5p Mec.",
  onixPlus: "ONIX PLUS SEDAN LT 1.0 12V Flex 4p Aut.",
  hilux: "Hilux CD 4x4 2.8 Diesel Mec.",
  fiat500: "500 Cabrio Dualogic Flex 1.4 8V",
  hrv: "HR-V EXL CVT 1.8 Flexone 16V 5p Aut.",
  kombi: "Kombi Furgao 1.4 Flex 8V",
  civic: "Civic Sedan EXL 2.0 Flex Aut. 4p",
};

describe("combustível", () => {
  it("vem do campo próprio da consulta", () => {
    expect(inferFuel("Flex")).toBe("flex");
    expect(inferFuel("Gasolina")).toBe("gasolina");
    expect(inferFuel("Diesel")).toBe("diesel");
  });

  it("entende o nome antigo do etanol", () => {
    // a FIPE ainda escreve "Álcool" em veículos mais velhos
    expect(inferFuel("Álcool")).toBe("etanol");
  });

  it("não confunde gasolina com gás", () => {
    expect(inferFuel("Gasolina")).toBe("gasolina");
  });

  it("não inventa quando não reconhece", () => {
    expect(inferFuel("")).toBeUndefined();
    expect(inferFuel("Outro")).toBeUndefined();
  });
});

describe("câmbio", () => {
  it("lê manual e automático das abreviações", () => {
    expect(inferTransmission(REAIS.onix)).toBe("manual");
    expect(inferTransmission(REAIS.onixPlus)).toBe("automatico");
  });

  it("reconhece automatizado pelo nome comercial", () => {
    // Dualogic não contém "automático" em lugar nenhum do texto
    expect(inferTransmission(REAIS.fiat500)).toBe("automatizado");
    expect(inferTransmission("Punto ESSENCE 1.6 Flex Dualogic")).toBe("automatizado");
  });

  it("CVT vence o 'Aut.' que aparece no mesmo nome", () => {
    expect(inferTransmission(REAIS.hrv)).toBe("cvt");
  });

  it("não responde quando o nome não diz", () => {
    expect(inferTransmission("Gol 1.0")).toBeUndefined();
  });
});

describe("carroceria", () => {
  it("lê hatch e sedã", () => {
    expect(inferBodyType(REAIS.onix)).toBe("hatch");
    expect(inferBodyType(REAIS.onixPlus)).toBe("sedan");
    expect(inferBodyType(REAIS.civic)).toBe("sedan");
  });

  it("reconhece picape pela cabine", () => {
    expect(inferBodyType(REAIS.hilux)).toBe("picape");
  });

  it("reconhece conversível", () => {
    expect(inferBodyType(REAIS.fiat500)).toBe("conversivel");
  });

  it("reconhece furgão como utilitário", () => {
    expect(inferBodyType(REAIS.kombi)).toBe("utilitario");
  });

  it("não responde quando não há pista", () => {
    expect(inferBodyType("Corolla XEI 2.0")).toBeUndefined();
  });
});

describe("portas", () => {
  it("lê o 5p e o 4p", () => {
    expect(inferDoors(REAIS.onix)).toBe(5);
    expect(inferDoors(REAIS.onixPlus)).toBe(4);
  });

  it("lê mesmo com espaço antes do p", () => {
    expect(inferDoors("Gol 1.0 Flex 4 p")).toBe(4);
  });

  it("ignora número fora da faixa plausível", () => {
    // "12V 8p" não existe; melhor não responder do que responder errado
    expect(inferDoors("Motor 1.0 12V 8p")).toBeUndefined();
  });

  it("não confunde com cilindrada nem com válvulas", () => {
    expect(inferDoors("ONIX 1.0 12V Flex")).toBeUndefined();
  });
});

describe("ficha completa", () => {
  it("preenche os quatro campos de um nome típico", () => {
    expect(inferSpecs(REAIS.onix, "Flex")).toEqual({
      transmission: "manual",
      fuel: "flex",
      bodyType: "hatch",
      doors: 5,
    });
  });

  it("devolve indefinido no que não conseguiu ler, sem chutar", () => {
    const specs = inferSpecs("Fusca 1300", "Gasolina");
    expect(specs.fuel).toBe("gasolina");
    expect(specs.transmission).toBeUndefined();
    expect(specs.bodyType).toBeUndefined();
    expect(specs.doors).toBeUndefined();
  });
});
