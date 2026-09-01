import { describe, expect, it } from "vitest";
import { DEFAULT_STAGES, nextInRotation } from "./crm";

describe("rodízio de leads", () => {
  const equipe = ["ana", "bruno", "carla"];

  it("começa pelo primeiro quando ninguém recebeu ainda", () => {
    expect(nextInRotation(equipe, null)).toBe("ana");
  });

  it("anda um a cada lead", () => {
    expect(nextInRotation(equipe, "ana")).toBe("bruno");
    expect(nextInRotation(equipe, "bruno")).toBe("carla");
  });

  it("dá a volta ao chegar no fim", () => {
    expect(nextInRotation(equipe, "carla")).toBe("ana");
  });

  it("recomeça do primeiro quando quem recebeu por último saiu da equipe", () => {
    // indexOf devolve -1; -1 + 1 = 0. Sem isso o cálculo daria índice negativo
    // e o rodízio pararia de entregar
    expect(nextInRotation(equipe, "quem-nao-existe-mais")).toBe("ana");
  });

  it("devolve nulo sem ninguém para receber", () => {
    expect(nextInRotation([], "ana")).toBeNull();
    expect(nextInRotation([], null)).toBeNull();
  });

  it("com uma pessoa só, ela recebe sempre", () => {
    expect(nextInRotation(["ana"], "ana")).toBe("ana");
  });

  it("distribui parelho ao longo de uma volta completa", () => {
    const recebidos: string[] = [];
    let ultimo: string | null = null;
    for (let i = 0; i < 6; i++) {
      ultimo = nextInRotation(equipe, ultimo);
      recebidos.push(ultimo!);
    }
    for (const pessoa of equipe) {
      expect(recebidos.filter((nome) => nome === pessoa)).toHaveLength(2);
    }
  });
});

describe("funil padrão", () => {
  it("abre e fecha: tem etapa de ganho e de perda", () => {
    expect(DEFAULT_STAGES.some((stage) => stage.kind === "won")).toBe(true);
    expect(DEFAULT_STAGES.some((stage) => stage.kind === "lost")).toBe(true);
  });

  it("começa por uma etapa aberta", () => {
    expect(DEFAULT_STAGES[0].kind).toBe("open");
  });
});
