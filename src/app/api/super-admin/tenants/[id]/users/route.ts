import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenants, users } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { hashPassword } from "@/lib/auth/password";
import { badRequest, conflict, jsonOk, notFound, withApi } from "@/lib/http";
import { createUserSchema } from "@/lib/validation/users";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Cria um usuário para a revenda (normalmente o admin inicial). */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:users:write");
  const { id } = await params;

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const db = await getDb();
  const tenantRows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!tenantRows[0] || tenantRows[0].status === "deleted") throw notFound("Revenda não encontrada");

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);
  if (existing.length > 0) throw conflict("Já existe um usuário com este e-mail");

  const { hash, salt } = await hashPassword(input.password);
  const created = await db
    .insert(users)
    .values({
      tenantId: id,
      email: input.email,
      name: input.name,
      passwordHash: hash,
      passwordSalt: salt,
      role: input.role,
      status: "active",
      mustChangePassword: input.mustChangePassword,
    })
    .returning({ id: users.id });

  await logAuditFor(
    context,
    {
      action: "tenant.user.create",
      entity: "user",
      entityId: created[0].id,
      tenantId: id,
      metadata: { email: input.email, role: input.role },
    },
    request,
  );

  return jsonOk({ id: created[0].id });
});
