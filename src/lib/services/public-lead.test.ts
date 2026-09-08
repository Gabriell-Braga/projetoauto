import { describe, expect, it } from "vitest";
import { composeLeadMessage } from "./public-lead";
import type { PublicLeadInput } from "@/lib/validation/leads";

function lead(extra: Partial<PublicLeadInput>): PublicLeadInput {
  return {
    tenantSlug: "revenda",
    name: "Ana Paula",
    phone: "31999998888",
    kind: "contato",
    ...extra,
  } as PublicLeadInput;
}

/**
 * O corpo do lead é o que o vendedor lê antes de ligar.
 *
 * Ele precisa entender em três segundos o que a pessoa quer. Guardar só os
 * campos estruturados obrigaria a abrir duas telas; despejar o JSON seria
 * pior. Estes testes travam o texto porque ele é interface, não log.
 */
describe("composeLeadMessage", () => {
  it("contato comum devolve o que a pessoa escreveu", () => {
    expect(composeLeadMessage(lead({ message: "Tem esse carro em preto?" }))).toBe(
      "Tem esse carro em preto?",
    );
  });

  it("contato sem texto não inventa mensagem", () => {
    expect(composeLeadMessage(lead({}))).toBeNull();
  });

  it("financiamento traz entrada e prazo em reais legíveis", () => {
    const texto = composeLeadMessage(
      lead({
        kind: "financiamento",
        financing: { downPaymentCents: 3_000_000, installments: 48 },
      }),
    );

    // R$ 30.000,00 e não "3000000"
    expect(texto).toContain("30.000,00");
    expect(texto).toContain("48x");
  });

  it("venda traz o carro, o ano e a quilometragem com separador", () => {
    const texto = composeLeadMessage(
      lead({
        kind: "venda",
        sellCar: {
          brand: "Chevrolet",
          model: "Onix",
          version: "1.0 LT",
          yearManufacture: 2021,
          yearModel: 2022,
          mileageKm: 45000,
        },
      }),
    );

    expect(texto).toContain("Chevrolet Onix 1.0 LT");
    expect(texto).toContain("2021/2022");
    // 45.000 km, não 45000
    expect(texto).toContain("45.000 km");
  });

  it("o recado da pessoa sobrevive junto dos dados estruturados", () => {
    // perder o texto livre seria perder a única parte que ela escreveu
    const texto = composeLeadMessage(
      lead({
        kind: "venda",
        message: "Só troco por SUV.",
        sellCar: {
          brand: "Fiat",
          model: "Argo",
          yearManufacture: 2020,
          yearModel: 2020,
          mileageKm: 60000,
        },
      }),
    );

    expect(texto).toContain("Fiat Argo");
    expect(texto).toContain("Só troco por SUV.");
  });

  it("intenção declarada sem os dados cai no texto livre, sem quebrar", () => {
    // o formulário pode chegar incompleto; melhor um lead simples que um erro
    expect(composeLeadMessage(lead({ kind: "financiamento", message: "Oi" }))).toBe("Oi");
    expect(composeLeadMessage(lead({ kind: "venda" }))).toBeNull();
  });
});
