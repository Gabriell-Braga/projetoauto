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
