import { getBindings } from "@/lib/cloudflare";

export type PhotoVariantName = "thumb" | "card" | "full";

/** Larguras-alvo geradas no browser antes do upload (o Workers não tem sharp). */
export const PHOTO_VARIANT_WIDTHS: Record<PhotoVariantName, number> = {
  thumb: 400,
  card: 800,
  full: 1600,
};

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB por variante já redimensionada

export const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"];

export function vehiclePhotoKey(
  tenantId: string,
  vehicleId: string,
  photoId: string,
  variant: PhotoVariantName,
  extension = "webp",
): string {
  return `tenants/${tenantId}/vehicles/${vehicleId}/${photoId}-${variant}.${extension}`;
}

export function tenantAssetKey(tenantId: string, kind: string, fileId: string, extension = "webp") {
  return `tenants/${tenantId}/${kind}/${fileId}.${extension}`;
}

export async function putObject(
  key: string,
  body: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { MEDIA } = await getBindings();
  await MEDIA.put(key, body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
  });
}

export async function getObject(key: string) {
  const { MEDIA } = await getBindings();
  return MEDIA.get(key);
}

export async function deleteObjects(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { MEDIA } = await getBindings();
  // o R2 aceita até 1000 chaves por chamada
  for (let index = 0; index < keys.length; index += 1000) {
    await MEDIA.delete(keys.slice(index, index + 1000));
  }
}

/** Todas as chaves de uma foto (as 3 variantes). */
export function photoKeys(variants: Record<string, string>): string[] {
  return Object.values(variants).filter(Boolean);
}
