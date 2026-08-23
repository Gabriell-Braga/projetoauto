import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { setSessionCookie } from "@/lib/auth/cookies";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { createSessionToken } from "@/lib/auth/session";
import { badRequest, forbidden, jsonOk, notFound, withApi } from "@/lib/http";
import { getTenantCoreById, resolvePanelAccess } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ tenantId: z.string().uuid() });

/**
 * "Entrar como" uma revenda.
 * A sessão continua sendo do super-admin (claims.imp guarda quem ele é de fato),
 * mas passa a operar com o tenant e o papel de administrador da revenda.
 * Toda ação feita assim fica marcada como `impersonated` no audit_log.
 */
export const POST = withApi(async (request: Request) => {
  const context = await requireApiSuperAdmin("platform:impersonate");
  if (context.impersonating) throw forbidden("Você já está dentro de uma revenda");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const tenant = await getTenantCoreById(parsed.data.tenantId);
  if (!tenant) throw notFound("Revenda não encontrada");
  if (resolvePanelAccess(tenant) === "blocked") {
    throw forbidden("Revenda com bloqueio total. Ajuste a situação antes de entrar.");
  }

  const token = await createSessionToken({
    sub: context.user.id,
    email: context.user.email,
    name: context.user.name,
    role: "revenda_admin",
    tenantId: tenant.id,
    imp: {
      userId: context.user.id,
      email: context.user.email,
      role: "super_admin",
    },
  });
  await setSessionCookie(token);

  await logAuditFor(
    context,
    {
      action: "platform.impersonate.start",
      entity: "tenant",
      entityId: tenant.id,
      tenantId: tenant.id,
      metadata: { slug: tenant.slug },
    },
    request,
  );

  return jsonOk({ redirectTo: "/admin", tenantName: tenant.name });
});
