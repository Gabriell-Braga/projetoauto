import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantSites } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  deleteObjects,
  putObject,
  tenantAssetKey,
} from "@/lib/storage/r2";
import { invalidateTenantCache } from "@/lib/tenant/service";

export const dynamic = "force-dynamic";

async function currentLogoKey(tenantId: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db
    .select({ logoKey: tenantSites.logoKey })
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, tenantId))
    .limit(1);
  return rows[0]?.logoKey ?? null;
}

function extensionFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("site:write");

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) throw badRequest("Arquivo ausente");
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) throw badRequest("Formato não suportado");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Arquivo muito grande");

  const key = tenantAssetKey(
    context.tenant.id,
    "logo",
    crypto.randomUUID(),
    extensionFor(file.type),
  );
  await putObject(key, await file.arrayBuffer(), file.type);

  const previous = await currentLogoKey(context.tenant.id);
  const db = await getDb();
  const existing = await db
    .select({ tenantId: tenantSites.tenantId })
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, context.tenant.id))
    .limit(1);

  if (existing[0]) {
    await db
      .update(tenantSites)
      .set({ logoKey: key })
      .where(eq(tenantSites.tenantId, context.tenant.id));
  } else {
    await db.insert(tenantSites).values({ tenantId: context.tenant.id, logoKey: key });
  }

  if (previous) await deleteObjects([previous]);
  await invalidateTenantCache({ id: context.tenant.id, slug: context.tenant.slug });
  await logAuditFor(context, { action: "site.logo.update", entity: "tenant_site" }, request);

  return jsonOk({ key });
});

export const DELETE = withApi(async (request: Request) => {
  const context = await requireApiTenant("site:write");

  const previous = await currentLogoKey(context.tenant.id);
  const db = await getDb();
  await db
    .update(tenantSites)
    .set({ logoKey: null })
    .where(eq(tenantSites.tenantId, context.tenant.id));

  if (previous) await deleteObjects([previous]);
  await invalidateTenantCache({ id: context.tenant.id, slug: context.tenant.slug });
  await logAuditFor(context, { action: "site.logo.delete", entity: "tenant_site" }, request);

  return jsonOk({ ok: true });
});
