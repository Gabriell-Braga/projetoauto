import { describe, expect, it } from "vitest";
import { FALLBACK_LIMITS, FEATURES, unreadyFeatures } from "./catalog";
import {
  buildEntitlements,
  checkLimit,
  featureQuota,
  featureTier,
  hasFeature,
  limitReached,
  remaining,
  tierAtLeast,
} from "./entitlements";

const START = buildEntitlements({
  id: "p1",
  name: "Start",
  limits: { maxVehicles: 50, maxUsers: 2, maxStores: 1 },
  features: { gestao_estoque: true, crm_leads: "basico", whatsapp_integrado: 0, suporte: "digital" },
});

const REDE = buildEntitlements({
  id: "p3",
  name: "Rede",
  limits: { maxVehicles: 300, maxUsers: 15, maxStores: 3 },
  features: {
    gestao_estoque: true,
    crm_leads: "completo",
    whatsapp_integrado: 3,
    dashboards: "avancado",
    gestao_multiunidade: true,
    suporte: "prioritario",
  },
});

describe("revenda sem plano", () => {
  it("não fica travada: cai no fallback", () => {
    const none = buildEntitlements(null);
    expect(none.planId).toBeNull();
    expect(none.limits.maxVehicles).toBeNull();
    expect(limitReached(none, "maxVehicles", 10_000)).toBe(false);
  });

  it("mantém os limites que o produto já tinha", () => {
    const none = buildEntitlements(null);
    expect(none.limits.maxPhotosPerVehicle).toBe(FALLBACK_LIMITS.maxPhotosPerVehicle);
    expect(none.limits.maxBanners).toBe(FALLBACK_LIMITS.maxBanners);
  });
});

describe("limites", () => {
  it("libera enquanto não encostou no teto", () => {
    expect(limitReached(START, "maxVehicles", 49)).toBe(false);
    expect(limitReached(START, "maxVehicles", 50)).toBe(true);
    expect(limitReached(START, "maxVehicles", 51)).toBe(true);
  });

  it("calcula o quanto ainda cabe", () => {
    expect(remaining(START, "maxUsers", 0)).toBe(2);
    expect(remaining(START, "maxUsers", 2)).toBe(0);
    expect(remaining(START, "maxUsers", 5)).toBe(0);
  });

  it("plano que não define um limite herda o fallback", () => {
    expect(START.limits.maxPhotosPerVehicle).toBe(FALLBACK_LIMITS.maxPhotosPerVehicle);
  });

  it("checkLimit explica a saída quando bloqueia", () => {
    const ok = checkLimit(START, "maxVehicles", 10);
    expect(ok.allowed).toBe(true);
    expect(ok.message).toBeUndefined();

    const blocked = checkLimit(START, "maxVehicles", 50);
    expect(blocked.allowed).toBe(false);
    expect(blocked.message).toContain("50 veículos");
    expect(blocked.message).toContain("plano");
  });
});

describe("funcionalidades", () => {
  it("booleano liga e desliga", () => {
    expect(hasFeature(START, "gestao_estoque")).toBe(true);
    expect(hasFeature(START, "gestao_multiunidade")).toBe(false);
  });

  it("funcionalidade ausente é sempre negada", () => {
    expect(hasFeature(START, "nao_existe")).toBe(false);
  });

  it("degrau zero conta como desligado", () => {
    expect(hasFeature(START, "whatsapp_integrado")).toBe(false);
    expect(hasFeature(REDE, "whatsapp_integrado")).toBe(true);
  });

  it("lê o degrau contratado", () => {
    expect(featureTier(START, "crm_leads")).toBe("basico");
    expect(featureTier(REDE, "crm_leads")).toBe("completo");
  });

  it("compara degraus na ordem certa", () => {
    expect(tierAtLeast(START, "crm_leads", "basico")).toBe(true);
    expect(tierAtLeast(START, "crm_leads", "completo")).toBe(false);
    expect(tierAtLeast(REDE, "crm_leads", "completo")).toBe(true);
    expect(tierAtLeast(REDE, "dashboards", "completo")).toBe(true);
  });

  it("lê quantidade contratada", () => {
    expect(featureQuota(START, "whatsapp_integrado")).toBe(0);
    expect(featureQuota(REDE, "whatsapp_integrado")).toBe(3);
  });
});

describe("aviso de funcionalidade não entregue", () => {
  /**
   * Escolhida do catálogo, não fixada no teste.
   *
   * A versão anterior citava uma funcionalidade pelo nome e quebrou no dia em
   * que ela ficou pronta — o teste acusava um defeito que era, na verdade,
   * trabalho entregue.
   */
  const naoEntregue = FEATURES.find((feature) => feature.status !== "pronto")!;
  const entregue = FEATURES.find((feature) => feature.status === "pronto")!;

  it("acusa quando o plano liga algo que ainda não existe", () => {
    const pending = unreadyFeatures({ [naoEntregue.key]: true, [entregue.key]: true });
    const keys = pending.map((feature) => feature.key);
    expect(keys).toContain(naoEntregue.key);
    expect(keys).not.toContain(entregue.key);
  });

  it("não acusa o que está desligado", () => {
    expect(unreadyFeatures({ [naoEntregue.key]: false })).toEqual([]);
  });

  it("acusa dependência de fornecedor", () => {
    // escolhida do catálogo pelo mesmo motivo da de cima: citar uma pelo nome
    // faz o teste quebrar no dia em que ela fica pronta
    const externa = FEATURES.find((feature) => feature.status === "depende_de_fornecedor");
    if (!externa) return; // nenhuma depende mais de fornecedor: nada a acusar

    const keys = unreadyFeatures({ [externa.key]: 1 }).map((feature) => feature.key);
    expect(keys).toContain(externa.key);
  });
});
