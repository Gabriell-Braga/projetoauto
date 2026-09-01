import { z } from "zod";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, notFound, withApi } from "@/lib/http";
import { getLead } from "@/lib/services/leads";
import { listLeadEvents } from "@/lib/services/crm";
import { getWhatsappConnection, lastInboundAt, sendToLead } from "@/lib/services/whatsapp";
import { sendMode, windowMinutesLeft } from "@/lib/integrations/whatsapp-rules";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Estado da janela, para a tela saber se pode mandar texto livre. */
export const GET = withApi(async (_request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:read");
  const { id } = await params;

  const lead = await getLead(context.tenant.id, id);
  if (!lead) throw notFound("Lead não encontrado");

  const connection = await getWhatsappConnection(context.tenant.id);
  if (!connection) return jsonOk({ conectado: false });

  const ultimaEntrada = await lastInboundAt(context.tenant.id, id);
  return jsonOk({
    conectado: true,
    modo: sendMode(ultimaEntrada),
    minutosRestantes: windowMinutesLeft(ultimaEntrada),
    ultimaEntrada,
  });
});

const schema = z.object({
  text: z.string().trim().min(1, "Escreva a mensagem").max(4000),
  templateName: z.string().trim().max(120).optional(),
  templateLanguage: z.string().trim().max(10).optional(),
  templateParameters: z.array(z.string().max(500)).max(10).optional(),
});

export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("leads:write");
  await requireFeature(context.tenant.id, "whatsapp_integrado");
  const { id } = await params;

  const lead = await getLead(context.tenant.id, id);
  if (!lead) throw notFound("Lead não encontrado");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const outcome = await sendToLead(context.tenant.id, id, parsed.data, {
    userId: context.user.id,
    userName: context.user.name,
  });

  return jsonOk({ ...outcome, events: await listLeadEvents(context.tenant.id, id) });
});
