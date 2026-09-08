import { describe, expect, it } from "vitest";
import { formatTime, headlineHours, summarizeHours } from "./hours";

const aberto = (weekday: number, open = "08:00", close = "18:00") => ({ weekday, open, close });
const fechado = (weekday: number) => ({ weekday, open: null, close: null });

describe("formatTime", () => {
  it("tira o zero à esquerda e o minuto redondo", () => {
    // ninguém escreve "das 08:00 às 18:00" num cartaz de loja
    expect(formatTime("08:00")).toBe("8h");
    expect(formatTime("18:00")).toBe("18h");
  });

  it("mantém o minuto quando ele existe", () => {
    expect(formatTime("08:30")).toBe("8h30");
    expect(formatTime("13:15")).toBe("13h15");
  });

  it("devolve o valor cru quando não é hora", () => {
    expect(formatTime("qualquer")).toBe("qualquer");
  });
});

describe("summarizeHours", () => {
  it("agrupa dias consecutivos com o mesmo horário", () => {
    const semana = [1, 2, 3, 4, 5].map((dia) => aberto(dia));
    expect(summarizeHours(semana)).toEqual([
      { label: "Seg a Sex", value: "8h às 18h" },
      // fim de semana aparece como fechado em vez de sumir: quem lê precisa
      // saber que não abre, e a ausência da linha deixa isso ambíguo
      { label: "Sáb a Dom", value: "Fechado" },
    ]);
  });

  it("separa o dia que tem horário diferente", () => {
    const semana = [...[1, 2, 3, 4, 5].map((dia) => aberto(dia)), aberto(6, "08:00", "13:00")];
    expect(summarizeHours(semana)).toEqual([
      { label: "Seg a Sex", value: "8h às 18h" },
      { label: "Sábado", value: "8h às 13h" },
      { label: "Domingo", value: "Fechado" },
    ]);
  });

  /**
   * O caso que justifica o agrupamento não pular dia fechado.
   *
   * Se domingo sumisse da lista em vez de virar "Fechado", sábado e segunda
   * ficariam consecutivos e a linha viraria "Sáb a Seg" — ou, com a semana
   * toda igual, "Seg a Dom" numa loja que não abre domingo. Alguém apareceria
   * na porta fechada por causa do texto.
   */
  it("não junta dias por cima de um dia fechado", () => {
    const semana = [
      ...[1, 2, 3, 4, 5, 6].map((dia) => aberto(dia)),
      fechado(0),
    ];
    const linhas = summarizeHours(semana);

    expect(linhas).toEqual([
      { label: "Seg a Sáb", value: "8h às 18h" },
      { label: "Domingo", value: "Fechado" },
    ]);
    expect(linhas.some((linha) => linha.label.includes("Dom") && linha.value !== "Fechado")).toBe(
      false,
    );
  });

  it("dia que não veio na lista conta como fechado, não como aberto", () => {
    // revenda que preencheu só a semana não pode virar "aberto todo dia"
    const linhas = summarizeHours([1, 2, 3, 4, 5].map((dia) => aberto(dia)));
    expect(linhas[0]).toEqual({ label: "Seg a Sex", value: "8h às 18h" });
    expect(linhas.at(-1)).toEqual({ label: "Sáb a Dom", value: "Fechado" });
  });

  it("começa a semana na segunda, não no domingo", () => {
    const linhas = summarizeHours([aberto(0, "09:00", "12:00"), ...[1, 2, 3, 4, 5].map((d) => aberto(d))]);
    expect(linhas[0].label).toBe("Seg a Sex");
  });

  it("sem horário nenhum devolve lista vazia", () => {
    expect(summarizeHours([])).toEqual([]);
  });
});

describe("headlineHours", () => {
  it("resume numa linha só para a barra do topo", () => {
    const semana = [...[1, 2, 3, 4, 5].map((dia) => aberto(dia)), aberto(6, "08:00", "13:00")];
    expect(headlineHours(semana)).toBe("Seg a Sex, 8h às 18h");
  });

  it("é nulo quando a loja não informou horário — a barra some", () => {
    expect(headlineHours([])).toBeNull();
  });

  it("é nulo quando todos os dias estão fechados, em vez de anunciar Fechado", () => {
    expect(headlineHours([0, 1, 2, 3, 4, 5, 6].map(fechado))).toBeNull();
  });
});
