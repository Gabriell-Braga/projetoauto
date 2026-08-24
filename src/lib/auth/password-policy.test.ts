import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  checkPassword,
  firstPasswordIssue,
  generateCompliantPassword,
  isObviousPassword,
  isPasswordStrong,
  strongPasswordSchema,
} from "./password-policy";

describe("política de senha", () => {
  it("aceita senha que cumpre todas as regras", () => {
    expect(isPasswordStrong("Revenda2026")).toBe(true);
  });

  it("recusa por tamanho", () => {
    expect(isPasswordStrong("Ab1cdef")).toBe(false);
    expect(firstPasswordIssue("Ab1cdef")).toContain(`${PASSWORD_MIN_LENGTH} caracteres`);
  });

  it("recusa sem maiúscula", () => {
    expect(isPasswordStrong("revenda2026")).toBe(false);
    expect(firstPasswordIssue("revenda2026")).toContain("maiúscula");
  });

  it("recusa sem minúscula", () => {
    expect(isPasswordStrong("REVENDA2026")).toBe(false);
    expect(firstPasswordIssue("REVENDA2026")).toContain("minúscula");
  });

  it("recusa sem número", () => {
    expect(isPasswordStrong("RevendaSegura")).toBe(false);
    expect(firstPasswordIssue("RevendaSegura")).toContain("número");
  });

  it("aceita acentuação como letra", () => {
    expect(isPasswordStrong("Ámbito2026")).toBe(true);
  });

  it("não devolve problema quando está tudo certo", () => {
    expect(firstPasswordIssue("Revenda2026")).toBeNull();
  });
});

describe("senhas óbvias", () => {
  it("bloqueia as clássicas", () => {
    for (const value of ["12345678", "senha123", "password1", "admin123"]) {
      expect(isObviousPassword(value)).toBe(true);
    }
  });

  it("bloqueia caractere repetido", () => {
    expect(isObviousPassword("aaaaaaaa")).toBe(true);
  });

  it("ignora maiúsculas e espaços na comparação", () => {
    expect(isObviousPassword("  Senha123  ")).toBe(true);
  });

  it("não confunde senha boa com óbvia", () => {
    expect(isObviousPassword("Revenda2026")).toBe(false);
  });
});

describe("checkPassword", () => {
  it("devolve o estado de cada regra", () => {
    const checks = checkPassword("revenda");
    expect(checks.find((c) => c.id === "lower")?.ok).toBe(true);
    expect(checks.find((c) => c.id === "upper")?.ok).toBe(false);
    expect(checks.find((c) => c.id === "digit")?.ok).toBe(false);
    expect(checks.find((c) => c.id === "length")?.ok).toBe(false);
  });

  it("fica tudo verde quando a senha serve", () => {
    expect(checkPassword("Revenda2026").every((check) => check.ok)).toBe(true);
  });
});

describe("schema compartilhado", () => {
  it("aceita senha forte", () => {
    expect(strongPasswordSchema.safeParse("Revenda2026").success).toBe(true);
  });

  it("acumula todos os problemas de uma vez", () => {
    const result = strongPasswordSchema.safeParse("abc");
    expect(result.success).toBe(false);
    if (!result.success) {
      // falta tamanho, maiúscula e número
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("recusa senha óbvia mesmo cumprindo o resto", () => {
    expect(strongPasswordSchema.safeParse("Senha123").success).toBe(false);
  });
});

describe("senha provisória gerada", () => {
  it("sempre passa na própria política", () => {
    for (let i = 0; i < 100; i++) {
      const password = generateCompliantPassword();
      expect(isPasswordStrong(password), `falhou para "${password}"`).toBe(true);
    }
  });

  it("respeita o tamanho pedido", () => {
    expect(generateCompliantPassword(20)).toHaveLength(20);
  });

  it("nunca fica abaixo do mínimo, mesmo se pedirem menos", () => {
    expect(generateCompliantPassword(3).length).toBeGreaterThanOrEqual(PASSWORD_MIN_LENGTH);
  });

  it("evita caracteres ambíguos", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCompliantPassword()).not.toMatch(/[0O1lI]/);
    }
  });

  it("não repete", () => {
    const values = new Set(Array.from({ length: 50 }, () => generateCompliantPassword()));
    expect(values.size).toBe(50);
  });
});
