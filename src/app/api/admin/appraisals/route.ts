import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createAppraisal, listAppraisals } from "@/lib/services/appraisals";
import { appraisalSchema } from "@/lib/validation/appraisals";
import type { AppraisalStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = withApi(async (request: Request) => {
  const context = await requireApiTenant("appraisals:read");
  await requireFeature(context.tenant.id, "avaliacao_veiculos");

  const query = new URL(request.url).searchParams;
  return jsonOk({
    appraisals: await listAppraisals(context.tenant.id, {
      status: (query.get("status") as AppraisalStatus) || undefined,
      leadId: query.get("leadId") || undefined,
    }),
  });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("appraisals:write");
  await requireFeature(context.tenant.id, "avaliacao_veiculos");

  const parsed = appraisalSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const id = await createAppraisal(context.tenant.id, context.user.id, parsed.data);
  await logAuditFor(
    context,
    {
      action: "appraisal.create",
      entity: "appraisal",
      entityId: id,
      metadata: {
        cliente: parsed.data.customerName,
        veiculo: `${parsed.data.brand} ${parsed.data.model}`,
        oferta: parsed.data.offerCents,
        status: parsed.data.status,
      },
    },
    request,
  );
  return jsonOk({ id });
});
