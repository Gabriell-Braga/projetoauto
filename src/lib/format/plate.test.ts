import { describe, expect, it } from "vitest";
import {
  formatPlate,
  isValidPlate,
  normalizePlate,
  plateEnd,
  plateKind,
} from "./plate";

describe("normalizePlate", () => {
  it("sobe para maiuscula e tira separadores", () => {
    expect(normalizePlate("abc-1234")).toBe("ABC1234");
    expect(normalizePlate(" abc 1d23 ")).toBe("ABC1D23");
  });

  it("corta no comprimento da placa", () => {
    expect(normalizePlate("ABC1234567")).toBe("ABC1234");
  });

  it("vazio e nulo viram string vazia", () => {
    expect(normalizePlate("")).toBe("");
    expect(normalizePlate(null)).toBe("");
    expect(normalizePlate(undefined)).toBe("");
  });
});

describe("plateKind", () => {
  it("reconhece a placa antiga", () => {
    expect(plateKind("ABC1234")).toBe("antiga");
    expect(plateKind("abc-1234")).toBe("antiga");
  });

  /*
   * O Mercosul nao substituiu o formato antigo: os dois circulam. Recusar a
   * placa antiga tiraria do estoque a maior parte dos seminovos.
   */
  it("reconhece a placa Mercosul", () => {
    expect(plateKind("ABC1D23")).toBe("mercosul");
    expect(plateKind("BRA0S17")).toBe("mercosul");
  });

  it("recusa o que nao e placa", () => {
    expect(plateKind("ABC123")).toBeNull(); // curta demais
    expect(plateKind("AB12345")).toBeNull(); // so duas letras
    expect(plateKind("ABCD123")).toBeNull(); // letra onde vai digito
    expect(plateKind("1234ABC")).toBeNull(); // invertida
    expect(plateKind("")).toBeNull();
  });
});

describe("formatPlate", () => {
  it("poe hifen na antiga, que e como ela e impressa", () => {
    expect(formatPlate("ABC1234")).toBe("ABC-1234");
  });

  it("nao poe hifen na Mercosul, que nao tem", () => {
    expect(formatPlate("ABC1D23")).toBe("ABC1D23");
  });

  /*
   * Formatar o que ainda nao e placa esconderia o erro de quem digitou: o
   * campo mostraria algo com cara de placa valida.
   */
  it("devolve incompleta como esta", () => {
    expect(formatPlate("ABC12")).toBe("ABC12");
    expect(formatPlate("")).toBe("");
  });
});

describe("plateEnd", () => {
  it("tira o ultimo digito, que e o que o site publico mostra", () => {
    expect(plateEnd("ABC1234")).toBe("4");
    expect(plateEnd("abc-1234")).toBe("4");
    expect(plateEnd("ABC1D23")).toBe("3");
  });

  it("sem placa nao ha final", () => {
    expect(plateEnd(null)).toBeNull();
    expect(plateEnd("")).toBeNull();
  });

  /*
   * Nenhum dos dois formatos termina em letra, mas o banco tem registros
   * antigos digitados a mao. Devolver a letra faria a ficha publica anunciar
   * um rodizio que nao existe.
   */
  it("ignora final que nao e digito", () => {
    expect(plateEnd("ABCDEFG")).toBeNull();
  });
});

describe("isValidPlate", () => {
  it("aceita os dois formatos e recusa o resto", () => {
    expect(isValidPlate("ABC1234")).toBe(true);
    expect(isValidPlate("ABC1D23")).toBe(true);
    expect(isValidPlate("ABC12")).toBe(false);
  });
});
