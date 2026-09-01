import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { jsonOk, withApi } from "@/lib/http";
import { adoptOrphanLeads } from "@/lib/services/crm";

export const dynamic = "force-dynamic";

/** Traz para o funil os leads que chegaram antes de ele existir. */
export const POST = withApi(async () => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "funil_comercial");

  return jsonOk({ adopted: await adoptOrphanLeads(context.tenant.id) });
});
