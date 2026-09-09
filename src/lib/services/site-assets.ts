import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tenantSites } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import type { TenantContext } from "@/lib/auth/guards";
import { badRequest } from "@/lib/http";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  deleteObjects,
  putObject,
  tenantAssetKey,
} from "@/lib/storage/r2";
import { invalidateTenantCache } from "@/lib/tenant/service";

/**
 * Imagem de identidade da revenda: logo e favicon.
 *
 * As duas fazem exatamente a mesma coisa — sobem um arquivo, trocam a chave
 * numa coluna, apagam o anterior e invalidam o cache. A logo já tinha rota
 * própria; o favicon existia só como coluna no banco, sem upload, sem tela e
 * sem tag no site. Copiar a rota inteira faria duas versões que iam divergir
 * na primeira mudança de validação.
 */
export type SiteAssetKind = "logo" | "favicon";

const CAMPOS = {
  logo: tenantSites.logoKey,
  favicon: tenantSites.faviconKey,
} as const;

/**
 * SVG entra no favicon, e só nele.
 *
 * É o formato que resolve o ícone em qualquer tamanho sem serrilhar, e o
 * runtime de Workers não tem como redimensionar um PNG. Fora do favicon ele
 * não entra: SVG é código, e um arquivo desses servido como logo num site de
 * terceiro é superfície de ataque sem contrapartida.
 */
const SVG = "image/svg+xml";

function tiposAceitos(kind: SiteAssetKind): string[] {
  return kind === "favicon" ? [...ALLOWED_IMAGE_TYPES, SVG] : [...ALLOWED_IMAGE_TYPES];
}

function extensionFor(type: string): string {
  if (type === SVG) return "svg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export async function currentAssetKey(
  tenantId: string,
  kind: SiteAssetKind,
): Promise<string | null> {
  const db = await getDb();
  const rows = await db
    .select({ key: CAMPOS[kind] })
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, tenantId))
    .limit(1);
  return rows[0]?.key ?? null;
}

export async function saveSiteAsset(
  context: TenantContext,
  request: Request,
  kind: SiteAssetKind,
): Promise<string> {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) throw badRequest("Arquivo ausente");
  if (!tiposAceitos(kind).includes(file.type)) throw badRequest("Formato não suportado");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Arquivo muito grande");

  const key = tenantAssetKey(context.tenant.id, kind, crypto.randomUUID(), extensionFor(file.type));
  await putObject(key, await file.arrayBuffer(), file.type);

  const previous = await currentAssetKey(context.tenant.id, kind);
  const db = await getDb();

  // a linha do site pode não existir ainda numa revenda recém-criada
  const existing = await db
    .select({ tenantId: tenantSites.tenantId })
    .from(tenantSites)
    .where(eq(tenantSites.tenantId, context.tenant.id))
    .limit(1);

  if (existing[0]) {
    await db
      .update(tenantSites)
      .set(kind === "logo" ? { logoKey: key } : { faviconKey: key })
      .where(eq(tenantSites.tenantId, context.tenant.id));
  } else {
    await db.insert(tenantSites).values(
      kind === "logo"
        ? { tenantId: context.tenant.id, logoKey: key }
        : { tenantId: context.tenant.id, faviconKey: key },
    );
  }

  if (previous) await deleteObjects([previous]);
  await invalidateTenantCache({ id: context.tenant.id, slug: context.tenant.slug });
  await logAuditFor(context, { action: `site.${kind}.update`, entity: "tenant_site" }, request);

  return key;
}

export async function removeSiteAsset(
  context: TenantContext,
  request: Request,
  kind: SiteAssetKind,
): Promise<void> {
  const previous = await currentAssetKey(context.tenant.id, kind);
  const db = await getDb();

  await db
    .update(tenantSites)
    .set(kind === "logo" ? { logoKey: null } : { faviconKey: null })
    .where(eq(tenantSites.tenantId, context.tenant.id));

  if (previous) await deleteObjects([previous]);
  await invalidateTenantCache({ id: context.tenant.id, slug: context.tenant.slug });
  await logAuditFor(context, { action: `site.${kind}.delete`, entity: "tenant_site" }, request);
}
