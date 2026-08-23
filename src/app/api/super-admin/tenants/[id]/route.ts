import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenants, users } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, conflict, jsonOk, notFound, withApi } from "@/lib/http";
import { isSlugTaken, updateTenantRecord } from "@/lib/services/tenants";
import { invalidateTenantCache } from "@/lib/tenant/service";
import { isTemplateSelectable } from "@/templates/manifests";
import { gtmSchema, updateTenantSchema } from "@/lib/validation/tenants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:tenants:write");
  const { id } = await params;

  const parsed = updateTenantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const db = await getDb();
  const found = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  const tenant = found[0];
  if (!tenant || tenant.status === "deleted") throw notFound("Revenda não encontrada");

  if (input.slug && input.slug !== tenant.slug && (await isSlugTaken(input.slug, id))) {
    throw conflict("Já existe uma revenda com este slug");
  }
  if (input.templateId && !isTemplateSelectable(input.templateId)) {
    throw badRequest("Template indisponível para seleção");
  }

  const { gtmCode, ...tenantFields } = input;

  // GTM da plataforma fica em tenants.gtm_code; a revenda pode sobrescrever
  // com o próprio código em tenant_sites.gtm_code.
  let gtmValue: string | null | undefined;
  if (gtmCode !== undefined) {
    const gtmParsed = gtmSchema.safeParse(gtmCode ?? "");
    if (!gtmParsed.success) throw badRequest("Código GTM inválido", gtmParsed.error.issues);
    gtmValue = gtmParsed.data ? gtmParsed.data.toUpperCase() : null;
  }

  const updated = await updateTenantRecord(id, {
    ...tenantFields,
    ...(gtmValue !== undefined ? { gtmCode: gtmValue } : {}),
  });
  if (!updated) throw notFound("Revenda não encontrada");

  await invalidateTenantCache(updated);

  await logAuditFor(
    context,
    {
      action: "tenant.update",
      entity: "tenant",
      entityId: id,
      tenantId: id,
      metadata: { changes: Object.keys(input) },
    },
    request,
  );

  return jsonOk({ id, slug: updated.slug });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:tenants:write");
  const { id } = await params;

  const db = await getDb();
  const found = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  const tenant = found[0];
  if (!tenant || tenant.status === "deleted") throw notFound("Revenda não encontrada");

  // exclusão lógica: preserva histórico, libera o slug e derruba os acessos
  await db
    .update(tenants)
    .set({
      status: "deleted",
      deletedAt: new Date(),
      slug: `${tenant.slug}-excluida-${Date.now()}`,
    })
    .where(eq(tenants.id, id));

  await db.update(users).set({ status: "disabled" }).where(eq(users.tenantId, id));
  await invalidateTenantCache(tenant);

  await logAuditFor(
    context,
    {
      action: "tenant.delete",
      entity: "tenant",
      entityId: id,
      tenantId: id,
      metadata: { slug: tenant.slug },
    },
    request,
  );

  return jsonOk({ id });
});
