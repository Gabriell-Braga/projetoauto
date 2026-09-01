import type { Role } from "@/db/schema";

/**
 * Permissões granulares. Roles novas = uma linha nova em ROLE_PERMISSIONS,
 * sem tocar em nenhuma checagem espalhada pelo app.
 */
export const PERMISSIONS = [
  // plataforma (super-admin)
  "platform:tenants:read",
  "platform:tenants:write",
  "platform:billing:read",
  "platform:billing:write",
  "platform:users:write",
  "platform:audit:read",
  "platform:impersonate",
  // tenant
  "vehicles:read",
  "vehicles:write",
  "leads:read",
  "leads:write",
  "site:read",
  "site:write",
  "users:read",
  "users:write",
  "tenant:settings",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const TENANT_READ: Permission[] = ["vehicles:read", "leads:read", "site:read", "users:read"];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: PERMISSIONS,
  revenda_admin: [
    ...TENANT_READ,
    "vehicles:write",
    "leads:write",
    "site:write",
    "users:write",
    "tenant:settings",
  ],
  vendedor: ["vehicles:read", "vehicles:write", "leads:read", "leads:write", "site:read"],
  visualizador: ["vehicles:read", "leads:read", "site:read"],
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super admin",
  revenda_admin: "Administrador da revenda",
  vendedor: "Vendedor",
  visualizador: "Visualizador",
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAny(role: Role, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** Permissões que alteram estado — bloqueadas quando o tenant está em modo somente-leitura. */
export function isWritePermission(permission: Permission): boolean {
  return permission.endsWith(":write") || permission === "tenant:settings";
}

/** Roles que um usuário com determinada role pode criar/gerenciar. */
export function assignableRoles(role: Role): Role[] {
  if (role === "super_admin") return ["revenda_admin", "vendedor", "visualizador"];
  if (role === "revenda_admin") return ["revenda_admin", "vendedor", "visualizador"];
  return [];
}
