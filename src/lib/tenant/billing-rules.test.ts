import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  effectiveBillingStatus,
  graceDaysLeft,
  isOverdue,
  isPublicSiteAvailable,
  resolvePanelAccess,
  type TenantAccessInput,
} from "./billing-rules";

const NOW = Date.UTC(2026, 7, 24, 12, 0, 0);

function tenant(overrides: Partial<TenantAccessInput> = {}): TenantAccessInput {
  return {
    status: "active",
    blockMode: "readonly",
    billing: {
      status: "adimplente",
      dueDay: 10,
      graceDays: 5,
      currentDueDate: NOW + 3 * DAY_MS,
    },
    ...overrides,
  };
}

describe("effectiveBillingStatus", () => {
  it("mantém adimplente antes do vencimento", () => {
    expect(effectiveBillingStatus(tenant(), NOW)).toBe("adimplente");
  });

  it("vira inadimplente no dia seguinte ao vencimento", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - DAY_MS },
    });
    expect(effectiveBillingStatus(overdue, NOW)).toBe("inadimplente");
  });

  it("continua inadimplente dentro da tolerância", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - 5 * DAY_MS },
    });
    expect(effectiveBillingStatus(overdue, NOW)).toBe("inadimplente");
  });

  it("suspende assim que a tolerância estoura", () => {
    const overdue = tenant({
      billing: {
        status: "inadimplente",
        dueDay: 10,
        graceDays: 5,
        currentDueDate: NOW - 6 * DAY_MS,
      },
    });
    expect(effectiveBillingStatus(overdue, NOW)).toBe("suspenso");
  });

  it("respeita tolerância zero", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 0, currentDueDate: NOW - 1 },
    });
    expect(effectiveBillingStatus(overdue, NOW)).toBe("suspenso");
  });

  it("suspensão manual vence o cálculo", () => {
    const suspended = tenant({
      billing: {
        status: "suspenso",
        dueDay: 10,
        graceDays: 5,
        currentDueDate: NOW + 30 * DAY_MS,
      },
    });
    expect(effectiveBillingStatus(suspended, NOW)).toBe("suspenso");
  });

  it("sem cobrança configurada, trata como adimplente", () => {
    expect(effectiveBillingStatus(tenant({ billing: null }), NOW)).toBe("adimplente");
  });

  it("inadimplente marcado à mão, sem vencimento, não vira suspenso sozinho", () => {
    const manual = tenant({
      billing: { status: "inadimplente", dueDay: 10, graceDays: 5, currentDueDate: null },
    });
    expect(effectiveBillingStatus(manual, NOW)).toBe("inadimplente");
  });
});

describe("isPublicSiteAvailable", () => {
  it("site no ar com revenda ativa e em dia", () => {
    expect(isPublicSiteAvailable(tenant(), NOW)).toBe(true);
  });

  it("inadimplente dentro da tolerância mantém o site no ar", () => {
    const overdue = tenant({
      billing: { status: "inadimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - DAY_MS },
    });
    expect(isPublicSiteAvailable(overdue, NOW)).toBe(true);
  });

  it("derruba o site quando a tolerância estoura", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - 10 * DAY_MS },
    });
    expect(isPublicSiteAvailable(overdue, NOW)).toBe(false);
  });

  it("revenda suspensa no cadastro derruba o site", () => {
    expect(isPublicSiteAvailable(tenant({ status: "suspended" }), NOW)).toBe(false);
  });
});

describe("resolvePanelAccess", () => {
  it("acesso total quando tudo está em dia", () => {
    expect(resolvePanelAccess(tenant(), NOW)).toBe("full");
  });

  it("somente leitura quando suspensa em modo readonly", () => {
    const suspended = tenant({
      billing: { status: "suspenso", dueDay: 10, graceDays: 5, currentDueDate: null },
    });
    expect(resolvePanelAccess(suspended, NOW)).toBe("readonly");
  });

  it("bloqueio total quando o modo é full", () => {
    const suspended = tenant({
      blockMode: "full",
      billing: { status: "suspenso", dueDay: 10, graceDays: 5, currentDueDate: null },
    });
    expect(resolvePanelAccess(suspended, NOW)).toBe("blocked");
  });

  it("atraso além da tolerância restringe o painel mesmo sem alguém marcar", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 3, currentDueDate: NOW - 9 * DAY_MS },
    });
    expect(resolvePanelAccess(overdue, NOW)).toBe("readonly");
  });
});

describe("graceDaysLeft e isOverdue", () => {
  it("não há contagem antes do vencimento", () => {
    expect(graceDaysLeft(tenant(), NOW)).toBeNull();
    expect(isOverdue(tenant(), NOW)).toBe(false);
  });

  it("conta os dias restantes durante a tolerância", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - 2 * DAY_MS },
    });
    expect(graceDaysLeft(overdue, NOW)).toBe(3);
    expect(isOverdue(overdue, NOW)).toBe(true);
  });

  it("chega a zero quando a tolerância acaba", () => {
    const overdue = tenant({
      billing: { status: "adimplente", dueDay: 10, graceDays: 5, currentDueDate: NOW - 8 * DAY_MS },
    });
    expect(graceDaysLeft(overdue, NOW)).toBe(0);
  });
});
