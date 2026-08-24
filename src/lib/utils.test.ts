import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatPhone, onlyDigits, slugify } from "./utils";

describe("slugify", () => {
  it("remove acentos e normaliza", () => {
    expect(slugify("Auto Center Silva")).toBe("auto-center-silva");
    expect(slugify("Veículos São João")).toBe("veiculos-sao-joao");
  });

  it("colapsa separadores e apara as pontas", () => {
    expect(slugify("  --Ré/Volta!!  ")).toBe("re-volta");
    expect(slugify("A & B")).toBe("a-b");
  });

  it("limita o tamanho", () => {
    expect(slugify("a".repeat(200)).length).toBeLessThanOrEqual(60);
  });

  it("devolve vazio quando não sobra nada utilizável", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("formatação pt-BR", () => {
  it("formata preço a partir de centavos", () => {
    expect(formatCurrency(8990000).replace(/\u00a0/g, " ")).toBe("R$ 89.900,00");
    expect(formatCurrency(0).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
  });

  it("formata quilometragem", () => {
    expect(formatNumber(32000)).toBe("32.000");
  });

  it("formata telefone fixo e celular", () => {
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("devolve o original quando não reconhece o formato", () => {
    expect(formatPhone("123")).toBe("123");
    expect(formatPhone(null)).toBe("—");
  });

  it("onlyDigits limpa máscara", () => {
    expect(onlyDigits("(11) 99999-8888")).toBe("11999998888");
  });
});
