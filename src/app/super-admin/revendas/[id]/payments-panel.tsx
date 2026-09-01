"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { apiGet, apiPost } from "@/lib/client/api";
import { formatCurrency } from "@/lib/utils";

type Payment = {
  id: string;
  status: string;
  valueCents: number;
  billingType: string;
  dueDate: string;
  paymentDate: string | null;
  invoiceUrl: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando",
  RECEIVED: "Recebida",
  CONFIRMED: "Confirmada",
  RECEIVED_IN_CASH: "Baixa manual",
  OVERDUE: "Vencida",
  REFUNDED: "Estornada",
  AWAITING_RISK_ANALYSIS: "Em análise",
};

const STATUS_TONES: Record<string, BadgeTone> = {
  PENDING: "warning",
  RECEIVED: "success",
  CONFIRMED: "success",
  RECEIVED_IN_CASH: "success",
  OVERDUE: "danger",
  REFUNDED: "neutral",
  AWAITING_RISK_ANALYSIS: "info",
};

const BILLING_LABELS: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão",
  UNDEFINED: "A escolher",
};

/** "2026-08-31" vem do gateway como data pura — Date() a puxaria um dia atrás. */
function formatGatewayDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
}

export function PaymentsPanel({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [environment, setEnvironment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiGet<{ environment: string; payments: Payment[] }>(
      `/api/super-admin/tenants/${tenantId}/payments`,
    );

    if (!result.ok) {
      setError(result.error);
      setPayments([]);
      return;
    }
    setError(null);
    setEnvironment(result.data.environment);
    setPayments(result.data.payments);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReceive(payment: Payment) {
    const production = environment === "production";
    const confirmed = await confirm(
      production
        ? {
            title: "Dar baixa manual",
            description: `${formatCurrency(payment.valueCents)} serão registrados como recebidos. Use só quando o dinheiro entrou por fora do gateway — o Asaas passa a considerar a cobrança quitada.`,
            confirmLabel: "Registrar recebimento",
            tone: "danger",
          }
        : {
            title: "Confirmar pagamento",
            description: `Marca ${formatCurrency(payment.valueCents)} como pago para exercitar o webhook. Isto é sandbox: nenhum dinheiro se move.`,
            confirmLabel: "Confirmar pagamento",
          },
    );
    if (!confirmed) return;

    setReceivingId(payment.id);
    const result = await apiPost(`/api/super-admin/tenants/${tenantId}/payments`, {
      paymentId: payment.id,
    });
    setReceivingId(null);

    if (!result.ok) {
      toast.error("Não foi possível dar baixa", result.error);
      return;
    }

    toast.success(
      "Baixa registrada",
      "O gateway vai avisar por webhook e a situação da revenda se ajusta sozinha.",
    );
    await load();
    router.refresh();
  }

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Cobranças no gateway</CardTitle>
          <CardDescription>
            Lidas direto do Asaas. Dar baixa aqui dispara o webhook, que é o mesmo caminho de um
            pagamento real.
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {environment ? (
            <Badge tone={environment === "production" ? "success" : "info"}>
              {environment === "production" ? "Produção" : "Sandbox"}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setPayments(null);
              void load();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>
      </CardHeader>

      {error ? (
        <div className="px-4 pb-4">
          <Alert tone="warning">{error}</Alert>
        </div>
      ) : payments === null ? (
        <div className="space-y-2 px-4 pb-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </div>
      ) : payments.length === 0 ? (
        <EmptyState
          title="Nenhuma cobrança ainda"
          description="A primeira sai no vencimento definido na contratação."
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th numeric>Vencimento</Th>
              <Th numeric>Valor</Th>
              <Th>Forma</Th>
              <Th>Situação</Th>
              <Th numeric>Pagamento</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {payments.map((payment) => {
              const open = payment.status === "PENDING" || payment.status === "OVERDUE";
              return (
                <Tr key={payment.id}>
                  <Td numeric>{formatGatewayDate(payment.dueDate)}</Td>
                  <Td numeric>{formatCurrency(payment.valueCents)}</Td>
                  <Td>{BILLING_LABELS[payment.billingType] ?? payment.billingType}</Td>
                  <Td>
                    <Badge tone={STATUS_TONES[payment.status] ?? "neutral"}>
                      {STATUS_LABELS[payment.status] ?? payment.status}
                    </Badge>
                  </Td>
                  <Td numeric>{formatGatewayDate(payment.paymentDate)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {payment.invoiceUrl ? (
                        <a
                          href={payment.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-7 items-center gap-1.5 rounded px-2.5 text-xs text-muted hover:bg-surface-2 hover:text-text"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Fatura
                        </a>
                      ) : null}
                      {open ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={receivingId === payment.id}
                          onClick={() => handleReceive(payment)}
                        >
                          {environment === "production" ? "Baixa manual" : "Confirmar pagamento"}
                        </Button>
                      ) : null}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
