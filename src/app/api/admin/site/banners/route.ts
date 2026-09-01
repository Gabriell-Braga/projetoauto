import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantBanners } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  putObject,
  tenantAssetKey,
} from "@/lib/storage/r2";
import { invalidateTenantCache } from "@/lib/tenant/service";
import { getEntitlements } from "@/lib/plans/service";
import { limitOf } from "@/lib/plans/entitlements";

export const dynamic = "force-dynamic";

const MAX_BANNERS = 8;

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("site:write");

  const formData = await request.formData().catch(() => null);
  if (!formData) throw badRequest("Envio inválido");

  const file = formData.get("file");
  if (!(file instanceof File)) throw badRequest("Imagem do banner ausente");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw badRequest("Formato não suportado");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Imagem muito grande");

  const db = await getDb();
  const existing = await db
    .select({ id: tenantBanners.id })
    .from(tenantBanners)
    .where(eq(tenantBanners.tenantId, context.tenant.id))
    .orderBy(asc(tenantBanners.position));

  const entitlements = await getEntitlements(context.tenant.id);
  const maxBanners = limitOf(entitlements, "maxBanners") ?? MAX_BANNERS;
  if (existing.length >= maxBanners) {
    throw badRequest(`Limite de ${maxBanners} banners atingido.`);
  }

  const extension =
    file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const key = tenantAssetKey(context.tenant.id, "banners", crypto.randomUUID(), extension);
  await putObject(key, await file.arrayBuffer(), file.type);

  const created = await db
    .insert(tenantBanners)
    .values({
      tenantId: context.tenant.id,
      imageKey: key,
      title: String(formData.get("title") ?? "") || null,
      subtitle: String(formData.get("subtitle") ?? "") || null,
      ctaLabel: String(formData.get("ctaLabel") ?? "") || null,
      ctaHref: String(formData.get("ctaHref") ?? "") || null,
      position: existing.length,
      active: true,
    })
    .returning({ id: tenantBanners.id });

  await invalidateTenantCache({ id: context.tenant.id, slug: context.tenant.slug });
  await logAuditFor(
    context,
    { action: "site.banner.create", entity: "tenant_banner", entityId: created[0].id },
    request,
  );

  return jsonOk({ id: created[0].id });
});
