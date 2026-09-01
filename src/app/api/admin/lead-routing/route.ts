import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { getRouting, setRouting } from "@/lib/services/crm";
import { routingSchema } from "@/lib/validation/crm";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const context = await requireApiTenant("leads:read");
  return jsonOk(await getRouting(context.tenant.id));
});

export const PATCH = withApi(async (request: Request) => {
  const context = await requireApiTenant("tenant:settings");
  await requireFeature(context.tenant.id, "distribuicao_leads");

  const parsed = routingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await setRouting(context.tenant.id, parsed.data.mode);
  await logAuditFor(
    context,
    { action: "lead.routing.update", entity: "lead_routing", metadata: parsed.data },
    request,
  );
  return jsonOk(parsed.data);
});
