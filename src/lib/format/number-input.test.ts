import { describe, expect, it } from "vitest";
import {
  centsToCurrencyInput,
  formatCurrencyInput,
  formatIntegerInput,
  groupThousands,
  parseCurrencyToCents,
  parseIntegerInput,
} from "./number-input";

describe("agrupamento de milhar", () => {
  it("agrupa de três em três da direita para a esquerda", () => {
    expect(groupThousands("1234")).toBe("1.234");
    expect(groupThousands("32000")).toBe("32.000");
    expect(groupThousands("1234567")).toBe("1.234.567");
  });

  it("não agrupa até três dígitos", () => {
    expect(groupThousands("999")).toBe("999");
    expect(groupThousands("7")).toBe("7");
  });

  it("remove zeros à esquerda sem apagar o número", () => {
    expect(groupThousands("007")).toBe("7");
    expect(groupThousands("0")).toBe("0");
  });
});

describe("campo inteiro", () => {
  it("formata quilometragem", () => {
    expect(formatIntegerInput("32000")).toBe("32.000");
  });

  it("ignora o que não é dígito", () => {
    expect(formatIntegerInput("32.000 km")).toBe("32.000");
  });

  it("campo vazio continua vazio, não vira zero", () => {
    // zero seria um valor; vazio é a pessoa ainda não ter respondido
    expect(formatIntegerInput("")).toBe("");
  });

  it("lê de volta o número", () => {
    expect(parseIntegerInput("32.000")).toBe(32000);
    expect(parseIntegerInput("")).toBe(0);
  });
});

describe("campo de dinheiro enquanto se digita", () => {
  it("agrupa a parte inteira", () => {
    expect(formatCurrencyInput("79900")).toBe("79.900");
  });

  it("preserva a vírgula recém-digitada", () => {
    // apagar a vírgula aqui tiraria o campo debaixo do dedo de quem digita
    expect(formatCurrencyInput("1234,")).toBe("1.234,");
  });

  it("não completa o centavo sozinho", () => {
    expect(formatCurrencyInput("1234,5")).toBe("1.234,5");
  });

  it("corta o que passa de dois centavos", () => {
    expect(formatCurrencyInput("1234,567")).toBe("1.234,56");
  });

  it("ignora vírgula repetida", () => {
    expect(formatCurrencyInput("12,34,56")).toBe("12,34");
  });

  it("aceita começar pela vírgula", () => {
    expect(formatCurrencyInput(",50")).toBe("0,50");
  });

  it("é estável: formatar de novo não muda nada", () => {
    for (const entrada of ["79.900,00", "1.234,5", "999", "0,05"]) {
      expect(formatCurrencyInput(entrada)).toBe(entrada);
    }
  });
});

describe("leitura do valor em centavos", () => {
  it("entende ponto como milhar e vírgula como decimal", () => {
    // Number("79.900,00") daria 79,9 — o erro seria de mil vezes
    expect(parseCurrencyToCents("79.900,00")).toBe(7_990_000);
  });

  it("uma casa decimal são décimos, não centavos", () => {
    expect(parseCurrencyToCents("10,5")).toBe(1050);
    expect(parseCurrencyToCents("10,05")).toBe(1005);
  });

  it("sem decimal, os centavos são zero", () => {
    expect(parseCurrencyToCents("79.900")).toBe(7_990_000);
  });

  it("campo vazio vale zero", () => {
    expect(parseCurrencyToCents("")).toBe(0);
    expect(parseCurrencyToCents("R$ ")).toBe(0);
  });

  it("volta e ida dão o mesmo número", () => {
    for (const cents of [0, 5, 99, 100, 123456, 7_990_000, 1_000_000_00]) {
      expect(parseCurrencyToCents(centsToCurrencyInput(cents))).toBe(cents);
    }
  });
});

describe("centavos para o campo", () => {
  it("mostra sempre as duas casas", () => {
    expect(centsToCurrencyInput(7_990_000)).toBe("79.900,00");
    expect(centsToCurrencyInput(1005)).toBe("10,05");
    expect(centsToCurrencyInput(100)).toBe("1,00");
  });

  it("zero aparece como zero, não como vazio", () => {
    expect(centsToCurrencyInput(0)).toBe("0,00");
  });

  it("valor abaixo de um real mantém o zero na frente", () => {
    expect(centsToCurrencyInput(50)).toBe("0,50");
  });
});
