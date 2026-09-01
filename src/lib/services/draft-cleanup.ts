import { and, eq, isNotNull, lt } from "drizzle-orm";
import { getDb } from "@/db";
import { vehiclePhotos, vehicles, type PhotoVariants } from "@/db/schema";
import { deleteObjects, photoKeys } from "@/lib/storage/r2";

/**
 * Quanto tempo um rascunho provisório sobrevive sem ser salvo.
 *
 * Folgado de propósito: cadastro com trinta fotos numa conexão ruim, ou pessoa
 * interrompida no meio, não pode ter o trabalho varrido embaixo. Quem continua
 * na tela renova o prazo a cada foto enviada.
 */
export const DRAFT_TTL_MS = 6 * 60 * 60 * 1000;

export type CleanupResult = {
  vehicles: number;
  photos: number;
  objects: number;
  ids: string[];
};

/**
 * Apaga rascunhos provisórios vencidos e as fotos que ficaram no R2.
 *
 * Só toca em linha com `draftExpiresAt` preenchido e no passado. Salvar a ficha
 * zera esse campo, então rascunho que a pessoa guardou de propósito nunca entra
 * aqui — a diferença entre "abandonado" e "guardado" está na coluna, não num
 * palpite sobre a idade do registro.
 */
export async function cleanupAbandonedDrafts(
  now = new Date(),
  dryRun = false,
): Promise<CleanupResult> {
  const db = await getDb();

  const expired = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(and(isNotNull(vehicles.draftExpiresAt), lt(vehicles.draftExpiresAt, now)));

  const ids = expired.map((row) => row.id);
  if (ids.length === 0) return { vehicles: 0, photos: 0, objects: 0, ids: [] };

  let photoCount = 0;
  const keys: string[] = [];

  for (const id of ids) {
    const photos = await db
      .select({ variants: vehiclePhotos.variants })
      .from(vehiclePhotos)
      .where(eq(vehiclePhotos.vehicleId, id));
    photoCount += photos.length;
    keys.push(...photos.flatMap((photo) => photoKeys(photo.variants as PhotoVariants)));
  }

  if (dryRun) {
    return { vehicles: ids.length, photos: photoCount, objects: keys.length, ids };
  }

  for (const id of ids) {
    await db.delete(vehiclePhotos).where(eq(vehiclePhotos.vehicleId, id));
    await db.delete(vehicles).where(eq(vehicles.id, id));
  }

  // o R2 por último: linha órfã no banco some na próxima faxina, arquivo órfão
  // no bucket ninguém encontra de novo
  await deleteObjects(keys);

  return { vehicles: ids.length, photos: photoCount, objects: keys.length, ids };
}
