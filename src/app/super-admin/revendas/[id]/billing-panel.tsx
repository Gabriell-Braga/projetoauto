"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { BILLING_STATUS_LABELS } from "@/lib/catalog/labels";
import { apiPatch, apiPost } from "@/lib/client/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { BillingStatus } from "@/db/schema";

export type BillingPanelProps = {
  tenantId: string;
  billing: {
    status: BillingStatus;
    dueDay: number;
    amountCents: number;
    currentDueDate: string | null;
    lastPaymentAt: string | null;
  } | null;
  events: {
    id: string;
    type: string;
    amountCents: number | null;
    referenceMonth: string | null;
    statusFrom: string | null;
    statusTo: string | null;
    note: string | null;
    createdByEmail: string | null;
    createdAt: string;
  }[];
};

const EVENT_LABELS: Record<string, string> = {
  payment: "Pagamento",
  status_change: "Mudança de situação",
  note: "Anotação",
};

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BillingPanel({ tenantId, billing, events }: BillingPanelProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  async function handleSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const dueDateValue = String(form.get("currentDueDate") ?? "");

    const result = await apiPatch(`/api/super-admin/tenants/${tenantId}/billing`, {
      status: String(form.get("status") ?? ""),
      dueDay: Number(form.get("dueDay") ?? 10),
      amountCents: Math.round(Number(String(form.get("amount") ?? "0").replace(",", ".")) * 100),
      currentDueDate: dueDateValue ? new Date(`${dueDateValue}T12:00:00Z`).toISOString() : null,
      note: String(form.get("note") ?? ""),
    });

    setSavingSettings(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingPayment(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const result = await apiPost(`/api/super-admin/tenants/${tenantId}/billing`, {
      amountCents: Math.round(
        Number(String(form.get("paymentAmount") ?? "0").replace(",", ".")) * 100,
      ),
      referenceMonth: String(form.get("referenceMonth") ?? currentMonth()),
      note: String(form.get("paymentNote") ?? ""),
      markAsPaid: form.get("markAsPaid") === "on",
    });

    setSavingPayment(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  const dueDateInput = billing?.currentDueDate
    ? new Date(billing.currentDueDate).toISOString().slice(0, 10)
    : "";

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Situação da assinatura</CardTitle>
            <CardDescription>
              Marcar como suspensa derruba o site público e restringe o painel da revenda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettings}>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <FormField label="Situação" htmlFor="status">
                  <Select id="status" name="status" defaultValue={billing?.status ?? "adimplente"}>
                    {Object.entries(BILLING_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Mensalidade (R$)" htmlFor="amount">
                  <Input
                    id="amount"
                    name="amount"
                    inputMode="decimal"
                    defaultValue={((billing?.amountCents ?? 0) / 100).toFixed(2)}
                  />
                </FormField>

                <FormField label="Dia do vencimento" htmlFor="dueDay">
                  <Select id="dueDay" name="dueDay" defaultValue={String(billing?.dueDay ?? 10)}>
                    {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                      <option key={day} value={day}>
                        Dia {day}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Próximo vencimento" htmlFor="currentDueDate">
                  <Input
                    id="currentDueDate"
                    name="currentDueDate"
                    type="date"
                    defaultValue={dueDateInput}
                  />
                </FormField>
              </div>

              <FormField label="Observação (vai para o histórico)" htmlFor="note">
                <Textarea id="note" name="note" rows={2} />
              </FormField>

              <Button type="submit" disabled={savingSettings}>
                {savingSettings ? "Salvando..." : "Salvar situação"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrar pagamento</CardTitle>
            <CardDescription>
              {billing?.lastPaymentAt
                ? `Último pagamento em ${formatDateTime(new Date(billing.lastPaymentAt))}.`
                : "Nenhum pagamento registrado ainda."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment}>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <FormField label="Valor recebido (R$)" htmlFor="paymentAmount">
                  <Input
                    id="paymentAmount"
                    name="paymentAmount"
                    inputMode="decimal"
                    defaultValue={((billing?.amountCents ?? 0) / 100).toFixed(2)}
                    required
                  />
                </FormField>

                <FormField label="Competência" htmlFor="referenceMonth" hint="Formato AAAA-MM">
                  <Input
                    id="referenceMonth"
                    name="referenceMonth"
                    defaultValue={currentMonth()}
                    pattern="\d{4}-\d{2}"
                    required
                  />
                </FormField>
              </div>

              <FormField label="Observação" htmlFor="paymentNote">
                <Input id="paymentNote" name="paymentNote" placeholder="PIX, boleto, etc." />
              </FormField>

              <label className="mb-4 flex items-center gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="markAsPaid"
                  defaultChecked
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                />
                Marcar como adimplente e reativar o site
              </label>

              <Button type="submit" disabled={savingPayment}>
                {savingPayment ? "Registrando..." : "Registrar pagamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico financeiro</CardTitle>
        </CardHeader>
        {events.length === 0 ? (
          <EmptyState title="Sem movimentações" description="Pagamentos e mudanças de situação aparecem aqui." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Data</Th>
                <Th>Tipo</Th>
                <Th>Valor</Th>
                <Th>Competência</Th>
                <Th>Detalhe</Th>
                <Th>Responsável</Th>
              </Tr>
            </Thead>
            <tbody>
              {events.map((item) => (
                <Tr key={item.id}>
                  <Td className="whitespace-nowrap">{formatDateTime(new Date(item.createdAt))}</Td>
                  <Td>{EVENT_LABELS[item.type] ?? item.type}</Td>
                  <Td className="tabular-nums">
                    {item.amountCents !== null ? formatCurrency(item.amountCents) : "—"}
                  </Td>
                  <Td>{item.referenceMonth ?? "—"}</Td>
                  <Td className="max-w-64 text-xs">
                    {item.statusFrom || item.statusTo ? (
                      <span className="mr-2">
                        {item.statusFrom ?? "—"} → {item.statusTo ?? "—"}
                      </span>
                    ) : null}
                    {item.note}
                  </Td>
                  <Td className="text-xs">{item.createdByEmail ?? "—"}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
