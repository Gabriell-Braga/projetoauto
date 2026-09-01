import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { listLeadEvents, recordLeadEvent } from "@/lib/services/crm";
import { getLead } from "@/lib/services/leads";
import { leadEventSchema } from "@/lib/validation/leads";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export const GET = withApi(async (_request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:read");
  await requireFeature(context.tenant.id, "historico_conversas");
  const { id } = await params;

  const lead = await getLead(context.tenant.id, id);
  if (!lead) throw notFound("Lead não encontrado");

  return jsonOk({ events: await listLeadEvents(context.tenant.id, id) });
});

export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "historico_conversas");
  const { id } = await params;

  const lead = await getLead(context.tenant.id, id);
  if (!lead) throw notFound("Lead não encontrado");

  const parsed = leadEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await recordLeadEvent({
    tenantId: context.tenant.id,
    leadId: id,
    type: parsed.data.type,
    body: parsed.data.body,
    userId: context.user.id,
    userName: context.user.name,
  });

  return jsonOk({ events: await listLeadEvents(context.tenant.id, id) });
});
