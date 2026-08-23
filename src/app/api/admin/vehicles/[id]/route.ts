import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { buildVehicleSlug, deleteVehicle, getVehicle } from "@/lib/services/vehicles";
import { vehicleUpdateSchema } from "@/lib/validation/vehicles";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("vehicles:write");
  const { id } = await params;

  const parsed = vehicleUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const existing = await getVehicle(context.tenant.id, id);
  if (!existing) throw notFound("Veículo não encontrado");

  const identityChanged =
    (input.brand !== undefined && input.brand !== existing.vehicle.brand) ||
    (input.model !== undefined && input.model !== existing.vehicle.model) ||
    (input.version !== undefined && input.version !== existing.vehicle.version) ||
    (input.yearModel !== undefined && input.yearModel !== existing.vehicle.yearModel);

  const slug = identityChanged
    ? await buildVehicleSlug(
        context.tenant.id,
        {
          brand: input.brand ?? existing.vehicle.brand,
          model: input.model ?? existing.vehicle.model,
          version: input.version ?? existing.vehicle.version,
          yearModel: input.yearModel ?? existing.vehicle.yearModel,
        },
        id,
      )
    : undefined;

  const db = await getDb();
  await db
    .update(vehicles)
    .set({ ...input, ...(slug ? { slug } : {}) })
    .where(and(eq(vehicles.tenantId, context.tenant.id), eq(vehicles.id, id)));

  await logAuditFor(
    context,
    {
      action: "vehicle.update",
      entity: "vehicle",
      entityId: id,
      metadata: { changes: Object.keys(input) },
    },
    request,
  );

  return jsonOk({ id, slug: slug ?? existing.vehicle.slug });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("vehicles:write");
  const { id } = await params;

  const removed = await deleteVehicle(context.tenant.id, id);
  if (!removed) throw notFound("Veículo não encontrado");

  await logAuditFor(
    context,
    {
      action: "vehicle.delete",
      entity: "vehicle",
      entityId: id,
      metadata: { brand: removed.brand, model: removed.model },
    },
    request,
  );

  return jsonOk({ id });
});
