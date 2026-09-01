import { describe, expect, it } from "vitest";
import { conversionRate, daysInStock, DAY_MS } from "./reports";
import { creditCost, financedAmount, totalPaid } from "./financings";

describe("taxa de conversão", () => {
  it("conta sobre o que já foi decidido, não sobre o total", () => {
    // 3 ganhos, 1 perdido, 96 ainda em aberto: 75%, não 3%
    expect(conversionRate(3, 1)).toBe(75);
  });

  it("não cai quando entram leads novos", () => {
    const antes = conversionRate(3, 1);
    const depois = conversionRate(3, 1); // 50 leads novos entraram; nada decidiu
    expect(depois).toBe(antes);
  });

  it("devolve nulo sem nada decidido, em vez de zero", () => {
    // zero por cento diria "ninguém compra"; a verdade é que ainda não se sabe
    expect(conversionRate(0, 0)).toBeNull();
  });

  it("chega a 100 e a 0", () => {
    expect(conversionRate(5, 0)).toBe(100);
    expect(conversionRate(0, 5)).toBe(0);
  });

  it("arredonda para uma casa", () => {
    expect(conversionRate(1, 2)).toBe(33.3);
  });
});

describe("tempo em estoque", () => {
  const agora = new Date("2026-09-01T12:00:00Z").getTime();

  it("conta dias inteiros", () => {
    expect(daysInStock(new Date(agora - 10 * DAY_MS), agora)).toBe(10);
  });

  it("carro cadastrado hoje tem zero dias, nunca negativo", () => {
    expect(daysInStock(new Date(agora), agora)).toBe(0);
    expect(daysInStock(new Date(agora + DAY_MS), agora)).toBe(0);
  });
});

describe("contas do financiamento", () => {
  it("financiado é preço menos entrada", () => {
    expect(financedAmount(5_000_000, 1_000_000)).toBe(4_000_000);
  });

  it("entrada maior que o preço não vira financiado negativo", () => {
    expect(financedAmount(5_000_000, 6_000_000)).toBe(0);
  });

  it("total pago soma entrada e parcelas", () => {
    expect(totalPaid(1_000_000, 48, 120_000)).toBe(1_000_000 + 48 * 120_000);
  });

  it("custo do crédito é o que passa do preço do carro", () => {
    // 10k de entrada + 48x 1.200 = 67.600; carro 50.000 → 17.600 de custo
    expect(creditCost(5_000_000, 1_000_000, 48, 120_000)).toBe(1_760_000);
  });

  it("pagamento à vista tem custo de crédito zero, não negativo", () => {
    expect(creditCost(5_000_000, 5_000_000, 0, 0)).toBe(0);
  });
});
