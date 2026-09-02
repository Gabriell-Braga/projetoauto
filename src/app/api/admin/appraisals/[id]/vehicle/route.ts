import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { linkAppraisalToVehicle } from "@/lib/services/appraisals";
import { linkVehicleSchema } from "@/lib/validation/appraisals";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Amarra a avaliação à ficha de estoque que nasceu dela.
 *
 * Rota própria em vez de mais um campo no PATCH geral: o vínculo é o único
 * dado da avaliação que não vem de quem digitou, e sim de um cadastro que
 * acabou de acontecer. Separado, ele tem a sua própria linha na auditoria —
 * "esta avaliação virou aquele carro" é a pergunta que se faz depois.
 */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("appraisals:write");
  await requireFeature(context.tenant.id, "avaliacao_veiculos");
  const { id } = await params;

  const parsed = linkVehicleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const ok = await linkAppraisalToVehicle(context.tenant.id, id, parsed.data.vehicleId);
  if (!ok) throw notFound("Avaliação não encontrada");

  await logAuditFor(
    context,
    {
      action: "appraisal.to_vehicle",
      entity: "appraisal",
      entityId: id,
      metadata: { veiculo: parsed.data.vehicleId },
    },
    request,
  );
  return jsonOk({ id });
});
