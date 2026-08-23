import { getDb } from "@/db";
import { auditLog, type Role } from "@/db/schema";
import type { AuthContext } from "@/lib/auth/guards";
import { clientIp } from "@/lib/http";

export type AuditActor = {
  userId: string | null;
  email: string | null;
  role: Role | null;
  tenantId: string | null;
  impersonated: boolean;
};

/** Em impersonation o ator registrado é sempre o super-admin real. */
export function actorFromContext(context: AuthContext | null): AuditActor | null {
  if (!context) return null;
  return {
    userId: context.claims.imp?.userId ?? context.claims.sub,
    email: context.claims.imp?.email ?? context.claims.email,
    role: context.claims.imp?.role ?? context.role,
    tenantId: context.claims.tenantId,
    impersonated: context.impersonating,
  };
}

export type AuditInput = {
  action: string;
  entity?: string;
  entityId?: string;
  tenantId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Registra uma ação no audit_log. Nunca deve derrubar a request principal. */
export async function logAudit(
  actor: AuditActor | null,
  input: AuditInput,
  request?: Request,
): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(auditLog).values({
      actorUserId: actor?.userId ?? null,
      actorEmail: actor?.email ?? null,
      actorRole: actor?.role ?? null,
      impersonated: Boolean(actor?.impersonated),
      tenantId: input.tenantId !== undefined ? input.tenantId : (actor?.tenantId ?? null),
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata,
      ip: request ? clientIp(request) : null,
      userAgent: request?.headers.get("user-agent") ?? null,
    });
  } catch (error) {
    console.error("[audit] falha ao registrar:", error);
  }
}

/** Atalho para logar usando o contexto autenticado. */
export function logAuditFor(
  context: AuthContext | null,
  input: AuditInput,
  request?: Request,
): Promise<void> {
  return logAudit(actorFromContext(context), input, request);
}
