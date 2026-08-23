import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vehiclePhotos } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import {
  reorderPhotos,
  setCoverPhoto,
  syncVehiclePhotoState,
  getVehicle,
} from "@/lib/services/vehicles";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  putObject,
  vehiclePhotoKey,
  type PhotoVariantName,
} from "@/lib/storage/r2";
import { photoCoverSchema, photoOrderSchema } from "@/lib/validation/vehicles";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const VARIANTS: PhotoVariantName[] = ["thumb", "card", "full"];

/**
 * Upload de uma foto já redimensionada no browser (3 variantes).
 * O runtime do Workers não tem sharp, então o resize acontece no cliente.
 */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("vehicles:write");
  const { id } = await params;

  const existing = await getVehicle(context.tenant.id, id);
  if (!existing) throw notFound("Veículo não encontrado");
  if (existing.photos.length >= 40) throw badRequest("Limite de 40 fotos por veículo atingido");

  const formData = await request.formData().catch(() => null);
  if (!formData) throw badRequest("Envio inválido");

  const photoId = crypto.randomUUID();
  const variants: Record<string, string> = {};

  for (const variant of VARIANTS) {
    const file = formData.get(variant);
    if (!(file instanceof File)) throw badRequest(`Variante "${variant}" ausente`);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw badRequest("Formato de imagem não suportado");
    }
    if (file.size > MAX_UPLOAD_BYTES) throw badRequest("Imagem muito grande");

    const extension = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const key = vehiclePhotoKey(context.tenant.id, id, photoId, variant, extension);
    await putObject(key, await file.arrayBuffer(), file.type);
    variants[variant] = key;
  }

  const db = await getDb();
  const nextPosition = existing.photos.length;

  await db.insert(vehiclePhotos).values({
    id: photoId,
    tenantId: context.tenant.id,
    vehicleId: id,
    variants: variants as { thumb: string; card: string; full: string },
    width: Number(formData.get("width")) || null,
    height: Number(formData.get("height")) || null,
    sizeBytes: Number(formData.get("sizeBytes")) || null,
    position: nextPosition,
    isCover: nextPosition === 0,
  });

  await syncVehiclePhotoState(context.tenant.id, id);

  await logAuditFor(
    context,
    { action: "vehicle.photo.upload", entity: "vehicle_photo", entityId: photoId, metadata: { vehicleId: id } },
    request,
  );

  const photos = await db
    .select()
    .from(vehiclePhotos)
    .where(eq(vehiclePhotos.vehicleId, id))
    .orderBy(asc(vehiclePhotos.position));

  return jsonOk({ photoId, photos });
});

/** Reordena as fotos ou define a capa. */
export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("vehicles:write");
  const { id } = await params;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) throw badRequest("Dados inválidos");

  if ("photoIds" in body) {
    const parsed = photoOrderSchema.safeParse(body);
    if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
    const ok = await reorderPhotos(context.tenant.id, id, parsed.data.photoIds);
    if (!ok) throw notFound("Foto não encontrada neste veículo");
    return jsonOk({ id });
  }

  const parsed = photoCoverSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const ok = await setCoverPhoto(context.tenant.id, id, parsed.data.photoId);
  if (!ok) throw notFound("Foto não encontrada neste veículo");

  return jsonOk({ id });
});
