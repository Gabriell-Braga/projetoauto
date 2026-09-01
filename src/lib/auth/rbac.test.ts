import { describe, expect, it } from "vitest";
import {
  canWithOverrides,
  effectivePermissions,
  TENANT_PERMISSIONS,
  PERMISSION_LABELS,
  can,
} from "./rbac";

describe("ajustes finos de permissão", () => {
  it("concede o que o perfil não dá", () => {
    expect(can("vendedor", "users:write")).toBe(false);
    expect(canWithOverrides("vendedor", "users:write", { granted: ["users:write"] })).toBe(true);
  });

  it("revoga o que o perfil dá", () => {
    expect(can("revenda_admin", "site:write")).toBe(true);
    expect(canWithOverrides("revenda_admin", "site:write", { revoked: ["site:write"] })).toBe(false);
  });

  it("revogado vence concedido quando os dois aparecem", () => {
    // configuração contraditória é erro de quem montou; negar é o lado seguro
    const overrides = { granted: ["users:write"], revoked: ["users:write"] };
    expect(canWithOverrides("vendedor", "users:write", overrides)).toBe(false);
  });

  it("sem ajustes, vale exatamente o perfil", () => {
    for (const permission of TENANT_PERMISSIONS) {
      expect(canWithOverrides("vendedor", permission, null)).toBe(can("vendedor", permission));
      expect(canWithOverrides("vendedor", permission, undefined)).toBe(can("vendedor", permission));
    }
  });

  it("lista efetiva reflete concessão e revogação juntas", () => {
    const permissions = effectivePermissions("vendedor", {
      granted: ["reports:read"],
      revoked: ["vehicles:write"],
    });
    expect(permissions).toContain("reports:read");
    expect(permissions).not.toContain("vehicles:write");
    expect(permissions).toContain("leads:write");
  });

  it("ajuste com permissão inexistente não derruba nem concede nada", () => {
    const overrides = { granted: ["inventar:tudo"], revoked: ["outra:coisa"] };
    expect(effectivePermissions("visualizador", overrides)).toEqual(
      effectivePermissions("visualizador", null),
    );
  });
});

describe("catálogo de permissões", () => {
  it("não oferece permissão de plataforma para ajuste na revenda", () => {
    // conceder platform:* a um vendedor daria acesso ao Painel Geral
    expect(TENANT_PERMISSIONS.some((permission) => permission.startsWith("platform:"))).toBe(false);
  });

  it("toda permissão ajustável tem rótulo em português", () => {
    const semRotulo = TENANT_PERMISSIONS.filter((permission) => !PERMISSION_LABELS[permission]);
    expect(semRotulo, `sem rótulo: ${semRotulo.join(", ")}`).toEqual([]);
  });
});
