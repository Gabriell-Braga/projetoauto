import { describe, expect, it } from "vitest";
import { ROLES } from "@/db/schema";
import { ROLE_PERMISSIONS, assignableRoles, can, canAny, isWritePermission } from "./rbac";

describe("matriz de permissões", () => {
  it("super_admin tem tudo", () => {
    expect(can("super_admin", "platform:tenants:write")).toBe(true);
    expect(can("super_admin", "platform:impersonate")).toBe(true);
    expect(can("super_admin", "vehicles:write")).toBe(true);
  });

  it("revenda_admin manda no próprio tenant, nunca na plataforma", () => {
    expect(can("revenda_admin", "vehicles:write")).toBe(true);
    expect(can("revenda_admin", "site:write")).toBe(true);
    expect(can("revenda_admin", "users:write")).toBe(true);
    expect(can("revenda_admin", "platform:tenants:write")).toBe(false);
    expect(can("revenda_admin", "platform:impersonate")).toBe(false);
  });

  it("vendedor mexe em estoque e leads, não em site nem usuários", () => {
    expect(can("vendedor", "vehicles:write")).toBe(true);
    expect(can("vendedor", "leads:write")).toBe(true);
    expect(can("vendedor", "site:read")).toBe(true);
    expect(can("vendedor", "site:write")).toBe(false);
    expect(can("vendedor", "users:read")).toBe(false);
    expect(can("vendedor", "users:write")).toBe(false);
  });

  it("visualizador é somente leitura", () => {
    const writes = ROLE_PERMISSIONS.visualizador.filter(isWritePermission);
    expect(writes).toEqual([]);
    expect(can("visualizador", "vehicles:read")).toBe(true);
    expect(can("visualizador", "vehicles:write")).toBe(false);
  });

  it("nenhuma role de revenda alcança permissão de plataforma", () => {
    for (const role of ["revenda_admin", "vendedor", "visualizador"] as const) {
      const platform = ROLE_PERMISSIONS[role].filter((permission) =>
        permission.startsWith("platform:"),
      );
      expect(platform).toEqual([]);
    }
  });

  it("toda role declarada tem entrada na matriz", () => {
    for (const role of ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it("canAny exige ao menos uma", () => {
    expect(canAny("vendedor", ["users:write", "vehicles:read"])).toBe(true);
    expect(canAny("vendedor", ["users:write", "site:write"])).toBe(false);
  });
});

describe("isWritePermission", () => {
  it("classifica escrita e leitura", () => {
    expect(isWritePermission("vehicles:write")).toBe(true);
    expect(isWritePermission("tenant:settings")).toBe(true);
    expect(isWritePermission("vehicles:read")).toBe(false);
  });
});

describe("assignableRoles", () => {
  it("ninguém cria super_admin pelo painel da revenda", () => {
    expect(assignableRoles("revenda_admin")).not.toContain("super_admin");
    expect(assignableRoles("super_admin")).not.toContain("super_admin");
  });

  it("vendedor e visualizador não atribuem perfis", () => {
    expect(assignableRoles("vendedor")).toEqual([]);
    expect(assignableRoles("visualizador")).toEqual([]);
  });
});
