import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { setSessionCookie } from "@/lib/auth/cookies";
import { requireApiAuth } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken } from "@/lib/auth/session";
import { badRequest, forbidden, jsonOk, unauthorized, withApi } from "@/lib/http";
import { changePasswordSchema } from "@/lib/validation/auth";

export const dynamic = "force-dynamic";

/** Troca de senha do próprio usuário. */
export const POST = withApi(async (request: Request) => {
  const context = await requireApiAuth();
  if (context.impersonating) {
    throw forbidden("Saia da revenda antes de trocar a sua senha");
  }

  const parsed = changePasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const valid = await verifyPassword(
    parsed.data.currentPassword,
    context.user.passwordHash,
    context.user.passwordSalt,
  );
  if (!valid) throw unauthorized("Senha atual incorreta");

  const { hash, salt } = await hashPassword(parsed.data.newPassword);
  const now = new Date();

  const db = await getDb();
  await db
    .update(users)
    .set({
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
      sessionsValidFrom: now,
    })
    .where(eq(users.id, context.user.id));

  // a troca invalida as sessões antigas, então emitimos uma nova para quem trocou
  const token = await createSessionToken({
    sub: context.user.id,
    email: context.user.email,
    name: context.user.name,
    role: context.role,
    tenantId: context.claims.tenantId,
  });
  await setSessionCookie(token);

  await logAuditFor(
    context,
    { action: "auth.change_password", entity: "user", entityId: context.user.id },
    request,
  );

  return jsonOk({ ok: true });
});
