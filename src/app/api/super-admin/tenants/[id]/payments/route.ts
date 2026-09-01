import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { subscriptions } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import {
  asaasEnvironment,
  getPayment,
  isGatewayConfigured,
  listSubscriptionPayments,
  receivePaymentInCash,
} from "@/lib/gateway/asaas";
import { badRequest, conflict, jsonOk, notFound, withApi } from "@/lib/http";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

async function gatewaySubscriptionId(tenantId: string): Promise<string> {
  const db = await getDb();
  const rows = await db
    .select({ gatewaySubscriptionId: subscriptions.gatewaySubscriptionId })
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .limit(1);

  const id = rows[0]?.gatewaySubscriptionId;
  if (!id) throw notFound("Esta revenda não tem assinatura no gateway");
  return id;
}

/**
 * Cobranças da assinatura, lidas direto do gateway.
 *
 * Evita ter que abrir o painel do Asaas para saber se a cobrança saiu, qual o
 * vencimento e se foi paga.
 */
export const GET = withApi(async (_request: Request, { params }: Params) => {
  await requireApiSuperAdmin("platform:billing:read");
  const { id } = await params;

  if (!isGatewayConfigured()) throw badRequest("Gateway não configurado");

  const { data } = await listSubscriptionPayments(await gatewaySubscriptionId(id));

  return jsonOk({
    environment: asaasEnvironment(),
    payments: data.map((payment) => ({
      id: payment.id,
      status: payment.status,
      valueCents: Math.round(payment.value * 100),
      billingType: payment.billingType,
      dueDate: payment.dueDate,
      paymentDate: payment.paymentDate,
      invoiceUrl: payment.invoiceUrl,
    })),
  });
});

const receiveSchema = z.object({ paymentId: z.string().min(1) });

/**
 * Dá baixa numa cobrança como recebida em dinheiro.
 *
 * No sandbox é o que permite testar o ciclo inteiro sem banco: a baixa dispara
 * o evento e o webhook atualiza a situação da revenda sozinho.
 */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiSuperAdmin("platform:billing:write");
  const { id } = await params;

  if (!isGatewayConfigured()) throw badRequest("Gateway não configurado");

  const parsed = receiveSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  // confere que a cobrança é mesmo da assinatura desta revenda
  const subscriptionId = await gatewaySubscriptionId(id);
  const { data } = await listSubscriptionPayments(subscriptionId);
  const target = data.find((payment) => payment.id === parsed.data.paymentId);
  if (!target) throw notFound("Cobrança não encontrada nesta assinatura");

  if (target.status !== "PENDING" && target.status !== "OVERDUE") {
    throw conflict("Esta cobrança não está em aberto");
  }

  // o Asaas ja devolve o valor em reais; nao ha conversao a fazer aqui
  await receivePaymentInCash(target.id, { value: target.value, date: new Date() });
  const updated = await getPayment(target.id);

  await logAuditFor(
    context,
    {
      action: "billing.payment.receive_in_cash",
      entity: "payment",
      entityId: target.id,
      tenantId: id,
      metadata: { environment: asaasEnvironment(), value: target.value },
    },
    request,
  );

  return jsonOk({ id: updated.id, status: updated.status, paymentDate: updated.paymentDate });
});
