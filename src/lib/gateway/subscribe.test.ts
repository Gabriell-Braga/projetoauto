import { describe, expect, it } from "vitest";
import { firstDueDate } from "./subscribe";

const NOW = new Date(Date.UTC(2026, 7, 25, 10, 0, 0)); // 25/08/2026

describe("primeiro vencimento", () => {
  it("sem trial, usa o dia escolhido ainda neste mês quando ele não passou", () => {
    const due = firstDueDate(28, 0, NOW);
    expect(due.toISOString()).toContain("2026-08-28");
  });

  it("sem trial, joga para o mês seguinte quando o dia já passou", () => {
    const due = firstDueDate(10, 0, NOW);
    expect(due.toISOString()).toContain("2026-09-10");
  });

  it("dia igual ao de hoje cobra hoje mesmo — é o dia contratado", () => {
    const due = firstDueDate(25, 0, NOW);
    expect(due.toISOString()).toContain("2026-08-25");
  });

  it("mesmo dia, hora diferente, resultado igual: comparação é por data", () => {
    const manha = firstDueDate(25, 0, new Date(Date.UTC(2026, 7, 25, 9, 0)));
    const noite = firstDueDate(25, 0, new Date(Date.UTC(2026, 7, 25, 23, 0)));
    expect(manha.toISOString()).toBe(noite.toISOString());
  });

  it("com trial, ignora o dia e conta os dias a partir de hoje", () => {
    const due = firstDueDate(10, 7, NOW);
    expect(due.toISOString()).toContain("2026-09-01");
  });

  it("trial de 30 dias cai um mês à frente", () => {
    const due = firstDueDate(10, 30, NOW);
    expect(due.toISOString()).toContain("2026-09-24");
  });

  it("nunca devolve data anterior a hoje", () => {
    const hoje = Date.UTC(2026, 7, 25);
    for (const day of [1, 5, 10, 15, 20, 25, 28]) {
      const due = firstDueDate(day, 0, NOW);
      expect(Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate()))
        .toBeGreaterThanOrEqual(hoje);
    }
  });
});

/**
 * O vencimento errava por fuso, não só por horário: das 21h à meia-noite o UTC
 * já está no dia seguinte, então "o dia já passou" disparava sozinho e a
 * primeira cobrança pulava um mês inteiro.
 */
describe("firstDueDate na virada do dia em Brasília", () => {
  it("contratar às 23h do dia 10, com vencimento dia 10, cobra neste mês", () => {
    // 02:00 UTC de 11/09 = 23:00 de 10/09 em Brasília
    const lateNight = new Date("2026-09-11T02:00:00.000Z");
    expect(firstDueDate(10, 0, lateNight).toISOString()).toBe("2026-09-10T12:00:00.000Z");
  });

  it("manhã e noite do mesmo dia dão o mesmo vencimento", () => {
    const morning = new Date("2026-09-10T12:00:00.000Z");
    const night = new Date("2026-09-11T02:00:00.000Z");
    expect(firstDueDate(10, 0, morning).getTime()).toBe(firstDueDate(10, 0, night).getTime());
  });

  it("empurra para o mês seguinte só quando o dia realmente passou", () => {
    const eleventh = new Date("2026-09-11T12:00:00.000Z");
    expect(firstDueDate(10, 0, eleventh).toISOString()).toBe("2026-10-10T12:00:00.000Z");
  });

  it("na virada do ano, dezembro empurra para janeiro do ano seguinte", () => {
    const lateDecember = new Date("2026-12-21T12:00:00.000Z");
    expect(firstDueDate(20, 0, lateDecember).toISOString()).toBe("2027-01-20T12:00:00.000Z");
  });
});
