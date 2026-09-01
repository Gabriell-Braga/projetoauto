import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { createFinancing, listFinancings } from "@/lib/services/financings";
import { financingSchema } from "@/lib/validation/crm";
import type { FinancingStatus } from "@/db/schema";

export const dynamic = "force-dynamic";

export const GET = withApi(async (request: Request) => {
  const context = await requireApiTenant("financings:read");
  await requireFeature(context.tenant.id, "gestao_financiamentos");

  const query = new URL(request.url).searchParams;
  return jsonOk({
    financings: await listFinancings(context.tenant.id, {
      status: (query.get("status") as FinancingStatus) || undefined,
      leadId: query.get("leadId") || undefined,
    }),
  });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("financings:write");
  await requireFeature(context.tenant.id, "gestao_financiamentos");

  const parsed = financingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const id = await createFinancing(context.tenant.id, context.user.id, parsed.data);
  await logAuditFor(
    context,
    {
      action: "financing.create",
      entity: "financing",
      entityId: id,
      metadata: { cliente: parsed.data.customerName, status: parsed.data.status },
    },
    request,
  );
  return jsonOk({ id });
});
