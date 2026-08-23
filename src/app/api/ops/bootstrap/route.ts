import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users, vehicleBrands, vehicleModels } from "@/db/schema";
import { runMigrations } from "@/db/migrate";
import { logAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { catalogEntries } from "@/lib/catalog/brands";
import { badRequest, conflict, jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(2),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres"),
});

/**
 * Cria o primeiro super-admin e popula o catálogo de marcas/modelos.
 * Só funciona enquanto não existir nenhum super-admin no banco.
 */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await runMigrations();

  const db = await getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);
  if (existing.length > 0) throw conflict("Já existe um super-admin. Use o painel para criar outros.");

  const { hash, salt } = await hashPassword(parsed.data.password);
  const inserted = await db
    .insert(users)
    .values({
      tenantId: null,
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: hash,
      passwordSalt: salt,
      role: "super_admin",
      status: "active",
    })
    .returning({ id: users.id });

  const seeded = await seedCatalog();

  await logAudit(
    { userId: inserted[0].id, email: parsed.data.email, role: "super_admin", tenantId: null, impersonated: false },
    { action: "platform.bootstrap", entity: "user", entityId: inserted[0].id, tenantId: null },
    request,
  );

  return jsonOk({ userId: inserted[0].id, catalog: seeded });
});

async function seedCatalog(): Promise<{ brands: number; models: number }> {
  const db = await getDb();
  const existing = await db.select({ id: vehicleBrands.id }).from(vehicleBrands).limit(1);
  if (existing.length > 0) return { brands: 0, models: 0 };

  const entries = catalogEntries();
  let modelsCount = 0;

  for (const entry of entries) {
    const brandId = crypto.randomUUID();
    await db.insert(vehicleBrands).values({
      id: brandId,
      name: entry.brand,
      slug: slugify(entry.brand),
    });
    if (entry.models.length > 0) {
      await db.insert(vehicleModels).values(
        entry.models.map((model) => ({
          brandId,
          name: model,
          slug: slugify(model),
        })),
      );
      modelsCount += entry.models.length;
    }
  }

  return { brands: entries.length, models: modelsCount };
}
