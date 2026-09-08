import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { getDomain, removeDomain, setPrimaryDomain } from "@/lib/services/domains";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({ isPrimary: z.literal(true) });

export const PATCH = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("site:write");
  const { id } = await params;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const ok = await setPrimaryDomain(context.tenant.id, id);
  if (!ok) throw notFound("Endereço não encontrado");

  const domain = await getDomain(context.tenant.id, id);
  await logAuditFor(
    context,
    {
      action: "domain.primary",
      entity: "domain",
      entityId: id,
      metadata: { dominio: domain?.domain },
    },
    request,
  );
  return jsonOk({ id });
});

export const DELETE = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("site:write");
  const { id } = await params;

  const domain = await getDomain(context.tenant.id, id);
  const ok = await removeDomain(context.tenant.id, id);
  if (!ok) throw notFound("Endereço não encontrado");

  await logAuditFor(
    context,
    {
      action: "domain.remove",
      entity: "domain",
      entityId: id,
      metadata: { dominio: domain?.domain },
    },
    request,
  );
  return jsonOk({ deleted: true });
});
