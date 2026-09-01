import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type Role, type User } from "@/db/schema";
import { forbidden, unauthorized } from "@/lib/http";
import {
  getTenantCoreById,
  resolvePanelAccess,
  type PanelAccess,
  type TenantCore,
} from "@/lib/tenant/service";
import { readSessionCookie } from "./cookies";
import { can, canWithOverrides, isWritePermission, type Permission } from "./rbac";
import { getEntitlements } from "@/lib/plans/service";
import { hasFeature } from "@/lib/plans/entitlements";
import { verifySessionToken, type SessionClaims } from "./session";

export type AuthContext = {
  claims: SessionClaims;
  user: User;
  /** Role efetiva (durante impersonation é a role assumida). */
  role: Role;
  impersonating: boolean;
};

export type TenantContext = AuthContext & {
  tenant: TenantCore;
  access: PanelAccess;
};

/**
 * Sessão validada contra o banco: usuário existe, está ativo e o token
 * foi emitido depois do último "invalidar sessões".
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const token = await readSessionCookie();
  if (!token) return null;

  const claims = await verifySessionToken(token);
  if (!claims) return null;

  const db = await getDb();
  const found = await db.select().from(users).where(eq(users.id, claims.sub)).limit(1);
  const user = found[0];
  if (!user || user.status !== "active") return null;

  // durante impersonation o usuário real é o super-admin (claims.imp.userId)
  const realUserId = claims.imp?.userId ?? claims.sub;
  if (realUserId !== user.id) {
    const realFound = await db.select().from(users).where(eq(users.id, realUserId)).limit(1);
    if (!realFound[0] || realFound[0].status !== "active") return null;
  }

  if (Math.floor(user.sessionsValidFrom.getTime() / 1000) > claims.iat) return null;

  return {
    claims,
    user,
    role: claims.role,
    impersonating: Boolean(claims.imp),
  };
}

/**
 * Decide o acesso somando os ajustes finos ao perfil.
 *
 * Os ajustes só valem se o plano da revenda incluir permissões avançadas —
 * senão, quem baixasse de plano manteria acessos que deixou de contratar.
 * Sem o recurso, vale o perfil puro, que é o comportamento de sempre.
 */
export async function allows(
  context: AuthContext,
  tenantId: string,
  permission: Permission,
): Promise<boolean> {
  const entitlements = await getEntitlements(tenantId);
  const overrides = hasFeature(entitlements, "permissoes_avancadas")
    ? context.user.permissionOverrides
    : null;
  return canWithOverrides(context.role, permission, overrides);
}

/* ------------------------------------------------------------------ */
/* Guards para páginas (redirecionam)                                  */
/* ------------------------------------------------------------------ */

export async function requirePageAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireSuperAdminPage(): Promise<AuthContext> {
  const context = await requirePageAuth();
  if (context.role !== "super_admin" || context.impersonating) redirect("/admin");
  if (context.user.mustChangePassword) redirect("/trocar-senha");
  return context;
}

export async function requireTenantPage(permission?: Permission): Promise<TenantContext> {
  const context = await requirePageAuth();
  if (!context.claims.tenantId) redirect("/super-admin");
  // durante impersonation a senha provisória é do super-admin, não da revenda
  if (context.user.mustChangePassword && !context.impersonating) redirect("/trocar-senha");

  const tenant = await getTenantCoreById(context.claims.tenantId);
  if (!tenant) redirect("/login?erro=tenant");

  const access = resolvePanelAccess(tenant);
  if (access === "blocked") redirect("/bloqueado");
  if (permission && !(await allows(context, tenant.id, permission))) {
    redirect("/admin?erro=permissao");
  }

  return { ...context, tenant, access };
}

/* ------------------------------------------------------------------ */
/* Guards para rotas de API (lançam ApiError)                          */
/* ------------------------------------------------------------------ */

export async function requireApiAuth(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) throw unauthorized();
  return context;
}

export async function requireApiSuperAdmin(permission?: Permission): Promise<AuthContext> {
  const context = await requireApiAuth();
  if (context.role !== "super_admin") throw forbidden();
  if (permission && !can(context.role, permission)) throw forbidden();
  return context;
}

export async function requireApiTenant(permission: Permission): Promise<TenantContext> {
  const context = await requireApiAuth();
  if (!context.claims.tenantId) throw forbidden("Sessão sem revenda associada");

  const tenant = await getTenantCoreById(context.claims.tenantId);
  if (!tenant) throw forbidden("Revenda indisponível");

  const access = resolvePanelAccess(tenant);
  if (access === "blocked") throw forbidden("Revenda suspensa");
  if (access === "readonly" && isWritePermission(permission)) {
    throw forbidden("Revenda suspensa: painel em modo somente leitura");
  }
  if (!(await allows(context, tenant.id, permission))) throw forbidden();

  return { ...context, tenant, access };
}
