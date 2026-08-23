import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Th, Thead, Tr } from "@/components/ui/table";
import { LEAD_STATUS, type LeadStatus } from "@/db/schema";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { LEAD_STATUS_LABELS } from "@/lib/catalog/labels";
import { getLeadStats, listLeads } from "@/lib/services/leads";
import { listTenantUsers } from "@/lib/services/users";
import { formatNumber } from "@/lib/utils";
import { LeadRow } from "./lead-row";

export const metadata: Metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const context = await requireTenantPage("leads:read");
  const params = await searchParams;

  const status = LEAD_STATUS.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : undefined;

  const [stats, result, teamMembers] = await Promise.all([
    getLeadStats(context.tenant.id),
    listLeads(context.tenant.id, {
      search: params.q?.trim() || undefined,
      status,
      page: Number(params.page ?? 1) || 1,
    }),
    listTenantUsers(context.tenant.id),
  ]);

  const canWrite = can(context.role, "leads:write") && context.access === "full";
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function pageHref(page: number) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (status) query.set("status", status);
    query.set("page", String(page));
    return `/admin/leads?${query.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Leads"
        description="Contatos recebidos pelo site da sua revenda."
      />

      <StatGrid>
        <StatCard
          label="Novos"
          value={formatNumber(stats.new)}
          tone={stats.new > 0 ? "warning" : "default"}
          hint="Aguardando primeiro contato"
        />
        <StatCard label="Em atendimento" value={formatNumber(stats.in_progress)} />
        <StatCard label="Convertidos" value={formatNumber(stats.won)} tone="success" />
        <StatCard label="Perdidos" value={formatNumber(stats.lost)} />
        <StatCard label="Total recebido" value={formatNumber(stats.total)} />
      </StatGrid>

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3 px-5 py-4" action="/admin/leads">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="q">
              Buscar
            </label>
            <Input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Nome, telefone, e-mail ou veículo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="status">
              Situação
            </label>
            <Select id="status" name="status" defaultValue={status ?? ""}>
              <option value="">Todas</option>
              {LEAD_STATUS.map((value) => (
                <option key={value} value={value}>
                  {LEAD_STATUS_LABELS[value]}
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
            title="Nenhum lead ainda"
            description="Quando alguém preencher o formulário do seu site, o contato aparece aqui."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Cliente</Th>
                <Th>Interesse</Th>
                <Th>Situação</Th>
                <Th>Responsável</Th>
                <Th>Recebido em</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((lead) => (
                <LeadRow
                  key={lead.id}
                  canWrite={canWrite}
                  assignees={teamMembers
                    .filter((user) => user.status === "active")
                    .map((user) => ({ id: user.id, name: user.name }))}
                  lead={{
                    id: lead.id,
                    name: lead.name,
                    phone: lead.phone,
                    email: lead.email,
                    message: lead.message,
                    vehicleLabel: lead.vehicleLabel,
                    status: lead.status,
                    internalNotes: lead.internalNotes,
                    assignedToUserId: lead.assignedToUserId,
                    assignedToName: lead.assignedToName,
                    utmSource: lead.utm?.source ?? null,
                    createdAt: lead.createdAt.toISOString(),
                  }}
                />
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className="text-brand-600 hover:underline">
              Anterior
            </Link>
          ) : null}
          <span className="text-ink-500">
            Página {result.page} de {totalPages}
          </span>
          {result.page < totalPages ? (
            <Link href={pageHref(result.page + 1)} className="text-brand-600 hover:underline">
              Próxima
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
