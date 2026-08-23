import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { badRequest, forbidden, jsonOk, notFound, withApi } from "@/lib/http";
import { resetPasswordSchema, updateUserSchema } from "@/lib/validation/users";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:users:write");
  const { id } = await params;

  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const db = await getDb();
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const target = found[0];
  if (!target) throw notFound("Usuário não encontrado");
  if (target.id === context.user.id && parsed.data.status === "disabled") {
    throw forbidden("Você não pode desativar o próprio usuário");
  }

  await db
    .update(users)
    .set({
      ...parsed.data,
      // desativar precisa invalidar as sessões abertas
      ...(parsed.data.status === "disabled" ? { sessionsValidFrom: new Date() } : {}),
    })
    .where(eq(users.id, id));

  await logAuditFor(
    context,
    {
      action: "user.update",
      entity: "user",
      entityId: id,
      tenantId: target.tenantId,
      metadata: parsed.data,
    },
    request,
  );

  return jsonOk({ id });
});

/** Redefine a senha de um usuário e derruba as sessões ativas dele. */
export const PUT = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:users:write");
  const { id } = await params;

  const parsed = resetPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const db = await getDb();
  const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
  const target = found[0];
  if (!target) throw notFound("Usuário não encontrado");

  const { hash, salt } = await hashPassword(parsed.data.password);
  await db
    .update(users)
    .set({
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: parsed.data.mustChangePassword,
      sessionsValidFrom: new Date(),
    })
    .where(eq(users.id, id));

  await logAuditFor(
    context,
    {
      action: "user.reset_password",
      entity: "user",
      entityId: id,
      tenantId: target.tenantId,
      metadata: { email: target.email },
    },
    request,
  );

  return jsonOk({ id });
});
