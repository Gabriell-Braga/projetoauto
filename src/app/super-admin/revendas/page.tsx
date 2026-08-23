import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { BillingStatusBadge, TenantStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { BILLING_STATUS, TENANT_STATUS, type BillingStatus, type TenantStatus } from "@/db/schema";
import { BILLING_STATUS_LABELS } from "@/lib/catalog/labels";
import { listTenants } from "@/lib/services/tenants";
import { getTemplateManifest } from "@/templates/manifests";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Revendas" };
export const dynamic = "force-dynamic";

const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  deleted: "Excluída",
};

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; billing?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = TENANT_STATUS.includes(params.status as TenantStatus)
    ? (params.status as TenantStatus)
    : undefined;
  const billing = BILLING_STATUS.includes(params.billing as BillingStatus)
    ? (params.billing as BillingStatus)
    : undefined;

  const result = await listTenants({
    search: params.q?.trim() || undefined,
    status: status === "deleted" ? undefined : status,
    billing,
    page: Number(params.page ?? 1) || 1,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <>
      <PageHeader
        title="Revendas"
        description={`${result.total} revenda(s) cadastrada(s).`}
        actions={
          <Link href="/super-admin/revendas/nova">
            <Button>Nova revenda</Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3 px-5 py-4" action="/super-admin/revendas">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="q">
              Buscar
            </label>
            <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Nome ou slug" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="status">
              Situação
            </label>
            <Select id="status" name="status" defaultValue={status ?? ""}>
              <option value="">Todas</option>
              {TENANT_STATUS.filter((value) => value !== "deleted").map((value) => (
                <option key={value} value={value}>
                  {TENANT_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="billing">
              Financeiro
            </label>
            <Select id="billing" name="billing" defaultValue={billing ?? ""}>
              <option value="">Todos</option>
              {BILLING_STATUS.map((value) => (
                <option key={value} value={value}>
                  {BILLING_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      <Card>
        {result.items.length === 0 ? (
          <EmptyState
            title="Nenhuma revenda encontrada"
            description="Ajuste os filtros ou cadastre uma nova revenda."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Revenda</Th>
                <Th>Template</Th>
                <Th>Situação</Th>
                <Th>Financeiro</Th>
                <Th>Mensalidade</Th>
                <Th>Vencimento</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td>
                    <Link
                      href={`/super-admin/revendas/${tenant.id}`}
                      className="font-medium text-ink-900 hover:text-brand-600"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-ink-500">/r/{tenant.slug}</p>
                  </Td>
                  <Td className="text-xs">{getTemplateManifest(tenant.templateId).name}</Td>
                  <Td><TenantStatusBadge status={tenant.status} /></Td>
                  <Td><BillingStatusBadge status={tenant.billingStatus} /></Td>
                  <Td className="tabular-nums">
                    {tenant.amountCents ? formatCurrency(tenant.amountCents) : "—"}
                  </Td>
                  <Td className="tabular-nums">{formatDate(tenant.currentDueDate)}</Td>
                  <Td className="text-right">
                    <Link href={`/super-admin/revendas/${tenant.id}`}>
                      <Button size="sm" variant="secondary">
                        Gerenciar
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => {
            const query = new URLSearchParams();
            if (params.q) query.set("q", params.q);
            if (status) query.set("status", status);
            if (billing) query.set("billing", billing);
            query.set("page", String(pageNumber));
            return (
              <Link
                key={pageNumber}
                href={`/super-admin/revendas?${query.toString()}`}
                className={
                  pageNumber === result.page
                    ? "rounded-md bg-brand-600 px-3 py-1.5 text-white"
                    : "rounded-md border border-ink-200 bg-white px-3 py-1.5 text-ink-600 hover:bg-ink-50"
                }
              >
                {pageNumber}
              </Link>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
