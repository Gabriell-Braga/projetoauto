import { describe, expect, it } from "vitest";
import { DEFAULT_MONTHLY_RATE, monthlyInstallmentCents, totalPaidCents } from "./installment";

const reais = (valor: number) => valor * 100;

describe("monthlyInstallmentCents", () => {
  /**
   * O número do próprio desenho.
   *
   * O Figma mostra "A partir de R$ 3.120/mês" para R$ 109.990 em 48 meses. Se
   * a conta se afastar disso, ou a fórmula está errada ou a taxa padrão saiu
   * do lugar — e o site passaria a prometer uma parcela diferente da que o
   * material de marketing usa.
   */
  it("reproduz o exemplo do desenho", () => {
    const parcela = monthlyInstallmentCents(reais(109_990), 48, DEFAULT_MONTHLY_RATE);
    expect(parcela).not.toBeNull();
    expect(parcela! / 100).toBeGreaterThan(3_090);
    expect(parcela! / 100).toBeLessThan(3_150);
  });

  it("parcela cresce quando o prazo encurta", () => {
    const curto = monthlyInstallmentCents(reais(100_000), 24, 1.35)!;
    const longo = monthlyInstallmentCents(reais(100_000), 48, 1.35)!;
    expect(curto).toBeGreaterThan(longo);
  });

  it("taxa zero vira divisão simples, sem NaN", () => {
    // a formula da Price divide por zero quando a taxa e zero, e "R$ NaN"
    // apareceria na tela sem nenhum erro no servidor
    expect(monthlyInstallmentCents(reais(48_000), 48, 0)).toBe(reais(1_000));
  });

  it("é nula sem valor a financiar", () => {
    expect(monthlyInstallmentCents(0, 48, 1.35)).toBeNull();
    expect(monthlyInstallmentCents(-100, 48, 1.35)).toBeNull();
  });

  it("é nula sem prazo", () => {
    expect(monthlyInstallmentCents(reais(50_000), 0, 1.35)).toBeNull();
  });

  it("devolve centavos inteiros", () => {
    const parcela = monthlyInstallmentCents(reais(37_777), 37, 1.29)!;
    expect(Number.isInteger(parcela)).toBe(true);
  });
});

describe("totalPaidCents", () => {
  it("multiplica parcela por prazo", () => {
    expect(totalPaidCents(reais(1_000), 48)).toBe(reais(48_000));
  });
});
