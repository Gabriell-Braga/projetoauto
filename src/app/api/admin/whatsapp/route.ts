import { z } from "zod";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { isVaultConfigured } from "@/lib/security/vault";
import {
  connectWhatsapp,
  disconnectWhatsapp,
  getWhatsappConnection,
} from "@/lib/services/whatsapp";

export const dynamic = "force-dynamic";

const schema = z.object({
  phoneNumberId: z.string().trim().min(5, "Informe o Phone Number ID"),
  wabaId: z.string().trim().max(60).optional(),
  displayPhone: z.string().trim().max(30).optional(),
  accessToken: z.string().trim().min(20, "Token muito curto"),
  appSecret: z.string().trim().min(10, "Informe o App Secret"),
  verifyToken: z
    .string()
    .trim()
    .min(8, "Use pelo menos 8 caracteres — este token protege o webhook"),
});

export const GET = withApi(async () => {
  const context = await requireApiTenant("leads:read");
  const connection = await getWhatsappConnection(context.tenant.id);

  return jsonOk({
    cofreConfigurado: isVaultConfigured(),
    // nada do cofre volta: a tela só precisa saber que existe
    conexao: connection
      ? {
          phoneNumberId: connection.phoneNumberId,
          wabaId: connection.wabaId,
          displayPhone: connection.displayPhone,
          status: connection.status,
          lastError: connection.lastError,
          lastInboundAt: connection.lastInboundAt,
        }
      : null,
  });
});

export const POST = withApi(async (request: Request) => {
  const context = await requireApiTenant("tenant:settings");
  await requireFeature(context.tenant.id, "whatsapp_integrado");

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  await connectWhatsapp(context.tenant.id, context.user.id, parsed.data);
  await logAuditFor(
    context,
    {
      action: "whatsapp.connect",
      entity: "whatsapp_connection",
      entityId: context.tenant.id,
      metadata: { phoneNumberId: parsed.data.phoneNumberId },
    },
    request,
  );

  return jsonOk({ connected: true });
});

export const DELETE = withApi(async (request: Request) => {
  const context = await requireApiTenant("tenant:settings");

  await disconnectWhatsapp(context.tenant.id);
  await logAuditFor(
    context,
    { action: "whatsapp.disconnect", entity: "whatsapp_connection", entityId: context.tenant.id },
    request,
  );
  return jsonOk({ disconnected: true });
});
