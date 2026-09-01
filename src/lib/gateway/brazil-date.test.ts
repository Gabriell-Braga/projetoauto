import { describe, expect, it } from "vitest";
import { billingDate, brazilDateParts, brazilIsoDate } from "./brazil-date";

/**
 * A janela das 21h à meia-noite em Brasília é onde tudo quebrou: o UTC já está
 * no dia seguinte e o Asaas não. Todo caso aqui mira nela.
 */
describe("data no fuso de Brasília", () => {
  it("às 23h20 de 31/08 ainda é 31/08, não 01/09", () => {
    // 02:20 UTC de 01/09 = 23:20 de 31/08 em Brasília
    const instant = new Date("2026-09-01T02:20:00.000Z");
    expect(brazilIsoDate(instant)).toBe("2026-08-31");
    expect(brazilDateParts(instant)).toEqual({ year: 2026, month: 8, day: 31 });
  });

  it("vira o dia só depois das 3h UTC", () => {
    expect(brazilIsoDate(new Date("2026-09-01T02:59:59.000Z"))).toBe("2026-08-31");
    expect(brazilIsoDate(new Date("2026-09-01T03:00:00.000Z"))).toBe("2026-09-01");
  });

  it("de manhã, UTC e Brasília concordam", () => {
    expect(brazilIsoDate(new Date("2026-08-31T12:00:00.000Z"))).toBe("2026-08-31");
  });

  it("atravessa a virada de ano sem perder o ano", () => {
    expect(brazilIsoDate(new Date("2027-01-01T02:00:00.000Z"))).toBe("2026-12-31");
  });

  it("preenche mês e dia com zero à esquerda", () => {
    expect(brazilIsoDate(new Date("2026-03-05T12:00:00.000Z"))).toBe("2026-03-05");
  });

  it("ancora a data ao meio-dia UTC, mesma data nos dois fusos", () => {
    const date = billingDate({ year: 2026, month: 9, day: 10 });
    expect(date.toISOString()).toBe("2026-09-10T12:00:00.000Z");
    expect(brazilIsoDate(date)).toBe("2026-09-10");
  });
});
