import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, defaultLandingPath } from "@/lib/auth/session";
import { badRequest, clientIp, jsonOk, tooManyRequests, unauthorized, withApi } from "@/lib/http";
import { rateLimit, resetRateLimit } from "@/lib/ratelimit";
import { getTenantCoreById, resolvePanelAccess } from "@/lib/tenant/service";
import { loginSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";

export const POST = withApi(async (request: Request) => {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const { email, password } = parsed.data;
  const ip = clientIp(request) ?? "desconhecido";

  const byIp = await rateLimit(`login:ip:${ip}`, 20, 900);
  const byEmail = await rateLimit(`login:email:${email}`, 8, 900);
  if (!byIp.allowed || !byEmail.allowed) throw tooManyRequests();

  const db = await getDb();
  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = found[0];

  const genericError = unauthorized("E-mail ou senha inválidos");
  if (!user || user.status !== "active") throw genericError;

  const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
  if (!valid) throw genericError;

  // usuário de revenda com revenda suspensa em modo "full" não entra
  if (user.tenantId) {
    const tenant = await getTenantCoreById(user.tenantId);
    if (!tenant) throw unauthorized("Revenda indisponível. Fale com o suporte.");
    if (resolvePanelAccess(tenant) === "blocked") {
      throw unauthorized("Acesso suspenso. Entre em contato com o suporte.");
    }
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
  });
  await setSessionCookie(token);

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  await resetRateLimit(`login:email:${email}`);

  await logAudit(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      impersonated: false,
    },
    { action: "auth.login", entity: "user", entityId: user.id, tenantId: user.tenantId },
    request,
  );

  return jsonOk({
    redirectTo: parsed.data.next?.startsWith("/") ? parsed.data.next : defaultLandingPath(user.role),
    mustChangePassword: user.mustChangePassword,
  });
});
