import { logAuditFor } from "@/lib/audit";
import { setSessionCookie } from "@/lib/auth/cookies";
import { requireApiAuth } from "@/lib/auth/guards";
import { createSessionToken } from "@/lib/auth/session";
import { badRequest, jsonOk, withApi } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Volta da impersonation para a sessão original de super-admin. */
export const POST = withApi(async (request: Request) => {
  const context = await requireApiAuth();
  const impersonation = context.claims.imp;
  if (!impersonation) throw badRequest("Você não está dentro de uma revenda");

  await logAuditFor(
    context,
    {
      action: "platform.impersonate.stop",
      entity: "tenant",
      entityId: context.claims.tenantId ?? undefined,
      tenantId: context.claims.tenantId,
    },
    request,
  );

  const token = await createSessionToken({
    sub: impersonation.userId,
    email: impersonation.email,
    name: context.user.name,
    role: impersonation.role,
    tenantId: null,
  });
  await setSessionCookie(token);

  return jsonOk({ redirectTo: "/super-admin" });
});
