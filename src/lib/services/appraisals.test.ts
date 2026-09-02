import { describe, expect, it } from "vitest";
import {
  acquisitionCost,
  appraisalMargin,
  isExpired,
  marginPercent,
  offerGapPercent,
  suggestedOffer,
} from "./appraisals";

const reais = (value: number) => value * 100;

describe("suggestedOffer", () => {
  it("desconta cada motivo da referência da FIPE", () => {
    expect(
      suggestedOffer({
        fipePriceCents: reais(50_000),
        conditionCents: reais(2_000),
        repairsCents: reais(3_000),
        debtsCents: reais(1_500),
        marketAdjustCents: 0,
      }),
    ).toBe(reais(43_500));
  });

  it("soma o ajuste de mercado quando ele é positivo", () => {
    // carro de giro rápido vale acima da tabela; forçar tudo para baixo faria
    // a pessoa mentir em outro campo para chegar no número certo
    expect(
      suggestedOffer({
        fipePriceCents: reais(50_000),
        conditionCents: 0,
        repairsCents: 0,
        debtsCents: 0,
        marketAdjustCents: reais(2_000),
      }),
    ).toBe(reais(52_000));
  });

  it("subtrai o ajuste de mercado quando ele é negativo", () => {
    expect(
      suggestedOffer({
        fipePriceCents: reais(50_000),
        conditionCents: 0,
        repairsCents: 0,
        debtsCents: 0,
        marketAdjustCents: -reais(4_000),
      }),
    ).toBe(reais(46_000));
  });

  it("não desce abaixo de zero", () => {
    // dívida maior que o valor do carro existe; oferta negativa não quer dizer nada
    expect(
      suggestedOffer({
        fipePriceCents: reais(10_000),
        conditionCents: 0,
        repairsCents: 0,
        debtsCents: reais(18_000),
        marketAdjustCents: 0,
      }),
    ).toBe(0);
  });

  it("devolve inteiro, para não gravar centavo quebrado", () => {
    const result = suggestedOffer({
      fipePriceCents: 10_001,
      conditionCents: 0,
      repairsCents: 0,
      debtsCents: 0,
      marketAdjustCents: -0.5,
    });
    expect(Number.isInteger(result)).toBe(true);
  });

  it("sem desconto nenhum, sugere a própria FIPE", () => {
    expect(
      suggestedOffer({
        fipePriceCents: reais(37_900),
        conditionCents: 0,
        repairsCents: 0,
        debtsCents: 0,
        marketAdjustCents: 0,
      }),
    ).toBe(reais(37_900));
  });
});

describe("acquisitionCost", () => {
  /**
   * O caso que parece contagem dobrada e não é: o reparo desceu a oferta e
   * ainda assim sai do caixa depois. Comprei por 47 um carro de 50 com 3 de
   * reparo — gastei 50.
   */
  it("soma à oferta o que a revenda ainda vai gastar", () => {
    expect(acquisitionCost(reais(47_000), reais(3_000), 0)).toBe(reais(50_000));
  });

  it("conta a dívida assumida junto", () => {
    expect(acquisitionCost(reais(40_000), reais(2_000), reais(1_500))).toBe(reais(43_500));
  });
});

describe("appraisalMargin", () => {
  it("é o que sobra do preço pretendido depois do custo", () => {
    expect(appraisalMargin(reais(55_000), reais(47_000), reais(3_000), 0)).toBe(reais(5_000));
  });

  it("fica negativa em negócio ruim, em vez de zerar", () => {
    // zerar esconderia o prejuízo justamente na tela em que ele precisa gritar
    expect(appraisalMargin(reais(48_000), reais(47_000), reais(3_000), 0)).toBe(-reais(2_000));
  });

  it("não conta o desgaste, que não sai do caixa", () => {
    // condição derruba a oferta lá atrás; aqui ela não aparece de novo
    const semReparo = appraisalMargin(reais(55_000), reais(45_000), 0, 0);
    expect(semReparo).toBe(reais(10_000));
  });
});

describe("marginPercent", () => {
  it("mede a margem sobre o preço de venda", () => {
    expect(marginPercent(reais(5_000), reais(50_000))).toBeCloseTo(10);
  });

  it("é nula sem preço de venda, em vez de dividir por zero", () => {
    expect(marginPercent(reais(5_000), 0)).toBeNull();
  });
});

describe("offerGapPercent", () => {
  it("acusa oferta acima do sugerido", () => {
    expect(offerGapPercent(reais(44_000), reais(40_000))).toBeCloseTo(10);
  });

  it("acusa oferta abaixo do sugerido", () => {
    expect(offerGapPercent(reais(36_000), reais(40_000))).toBeCloseTo(-10);
  });

  it("é nula quando não há sugestão — sem FIPE não há do que se afastar", () => {
    expect(offerGapPercent(reais(30_000), 0)).toBeNull();
  });
});

describe("isExpired", () => {
  const agora = new Date("2026-09-02T12:00:00Z");

  it("proposta sem prazo não vence", () => {
    expect(isExpired(null, agora)).toBe(false);
  });

  it("vence depois da data", () => {
    expect(isExpired(new Date("2026-09-01T12:00:00Z"), agora)).toBe(true);
  });

  it("ainda vale no futuro", () => {
    expect(isExpired(new Date("2026-09-10T12:00:00Z"), agora)).toBe(false);
  });
});
