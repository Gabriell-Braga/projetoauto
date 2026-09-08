import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { addDomain, listDomains } from "@/lib/services/domains";

export const dynamic = "force-dynamic";

const schema = z.object({ domain: z.string().trim().min(3).max(253) });

export const GET = withApi(async () => {
  const context = await requireApiTenant("site:read");
  return jsonOk({ domains: await listDomains(context.tenant.id) });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("site:write");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const id = await addDomain(context.tenant.id, context.user.id, parsed.data.domain);
  await logAuditFor(
    context,
    {
      action: "domain.add",
      entity: "domain",
      entityId: id,
      metadata: { dominio: parsed.data.domain },
    },
    request,
  );
  return jsonOk({ id });
});
