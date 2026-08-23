import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { jsonOk, notFound, withApi } from "@/lib/http";
import { deletePhoto } from "@/lib/services/vehicles";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; photoId: string }> };

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("vehicles:write");
  const { id, photoId } = await params;

  const removed = await deletePhoto(context.tenant.id, id, photoId);
  if (!removed) throw notFound("Foto não encontrada");

  await logAuditFor(
    context,
    {
      action: "vehicle.photo.delete",
      entity: "vehicle_photo",
      entityId: photoId,
      metadata: { vehicleId: id },
    },
    request,
  );

  return jsonOk({ photoId });
});
