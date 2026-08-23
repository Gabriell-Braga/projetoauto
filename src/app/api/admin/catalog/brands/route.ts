import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { vehicleBrands, vehicleModels } from "@/db/schema";
import { requireApiTenant } from "@/lib/auth/guards";
import { cached, invalidate } from "@/lib/cache";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

export type BrandCatalog = { brand: string; models: string[] }[];

/** Catálogo global de marcas/modelos — cacheado no KV por ser praticamente estático. */
export const GET = withApi(async () => {
  await requireApiTenant("vehicles:read");

  const catalog = await cached<BrandCatalog>("catalog:brands:v1", 3600, async () => {
    const db = await getDb();
    const rows = await db
      .select({
        brand: vehicleBrands.name,
        model: vehicleModels.name,
      })
      .from(vehicleBrands)
      .leftJoin(vehicleModels, eq(vehicleModels.brandId, vehicleBrands.id))
      .orderBy(asc(vehicleBrands.name), asc(vehicleModels.name));

    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      if (!grouped.has(row.brand)) grouped.set(row.brand, []);
      if (row.model) grouped.get(row.brand)!.push(row.model);
    }
    return Array.from(grouped.entries()).map(([brand, models]) => ({ brand, models }));
  });

  return jsonOk(catalog);
});

const addSchema = z.object({
  brand: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80).optional(),
});

/** Permite a revenda cadastrar uma marca/modelo que não está no catálogo. */
export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("vehicles:write");

  const parsed = addSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const { brand, model } = parsed.data;

  const db = await getDb();
  const brandSlug = slugify(brand);

  const existingBrand = await db
    .select({ id: vehicleBrands.id })
    .from(vehicleBrands)
    .where(eq(vehicleBrands.slug, brandSlug))
    .limit(1);

  let brandId = existingBrand[0]?.id;
  if (!brandId) {
    const created = await db
      .insert(vehicleBrands)
      .values({ name: brand, slug: brandSlug, createdByTenantId: context.tenant.id })
      .returning({ id: vehicleBrands.id });
    brandId = created[0].id;
  }

  if (model) {
    const modelSlug = slugify(model);
    const existingModel = await db
      .select({ id: vehicleModels.id })
      .from(vehicleModels)
      .where(and(eq(vehicleModels.brandId, brandId), eq(vehicleModels.slug, modelSlug)))
      .limit(1);

    if (!existingModel[0]) {
      await db
        .insert(vehicleModels)
        .values({ brandId, name: model, slug: modelSlug, createdByTenantId: context.tenant.id });
    }
  }

  await invalidate("catalog:brands:v1");

  return jsonOk({ brandId });
});
