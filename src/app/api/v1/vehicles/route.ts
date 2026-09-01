import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles } from "@/db/schema";
import { requireApiKey } from "@/lib/api/key-auth";
import { jsonOk, withApi } from "@/lib/http";
import { mediaUrl } from "@/lib/paths";

export const dynamic = "force-dynamic";

const MAX_PAGE = 200;

/**
 * Estoque da revenda.
 *
 * Rascunho fica de fora: é ficha pela metade, e portal que consumisse isso
 * publicaria anúncio incompleto.
 */
export const GET = withApi(async (request: Request) => {
  const { tenantId } = await requireApiKey(request);

  const query = new URL(request.url).searchParams;
  const limit = Math.min(Number(query.get("limite")) || 50, MAX_PAGE);
  const status = query.get("situacao");

  const conditions = [
    eq(vehicles.tenantId, tenantId),
    status
      ? eq(vehicles.status, status as "available")
      : inArray(vehicles.status, ["available", "reserved", "sold"]),
  ];

  const db = await getDb();
  const rows = await db
    .select()
    .from(vehicles)
    .where(and(...conditions))
    .orderBy(desc(vehicles.createdAt))
    .limit(limit);

  return jsonOk({
    veiculos: rows.map((vehicle) => ({
      id: vehicle.id,
      marca: vehicle.brand,
      modelo: vehicle.model,
      versao: vehicle.version,
      anoFabricacao: vehicle.yearManufacture,
      anoModelo: vehicle.yearModel,
      quilometragem: vehicle.mileageKm,
      precoCentavos: vehicle.priceCents,
      precoSobConsulta: vehicle.priceOnRequest,
      cambio: vehicle.transmission,
      combustivel: vehicle.fuel,
      carroceria: vehicle.bodyType,
      cor: vehicle.color,
      portas: vehicle.doors,
      opcionais: vehicle.options ?? [],
      descricao: vehicle.description,
      situacao: vehicle.status,
      fotoCapa: mediaUrl(vehicle.coverPhotoKey),
      totalFotos: vehicle.photosCount,
      atualizadoEm: vehicle.updatedAt.toISOString(),
    })),
  });
});
