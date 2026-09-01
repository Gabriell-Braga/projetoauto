import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { BillingStatusBadge, TenantStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { getPlatformStats, listTenants } from "@/lib/services/tenants";
import { formatDate, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel Geral" };
export const dynamic = "force-dynamic";

export default async function SuperAdminHome() {
  const [stats, recent] = await Promise.all([getPlatformStats(), listTenants({ pageSize: 8 })]);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Revendas, adimplência e volume da plataforma."
        actions={
          <Link href="/super-admin/revendas/nova">
            <Button>Nova revenda</Button>
          </Link>
        }
      />

      <StatGrid>
        <StatCard
          label="Revendas ativas"
          value={formatNumber(stats.tenantsActive)}
          hint={`${formatNumber(stats.tenantsTotal)} no total`}
        />
        <StatCard
          label="Com pendência"
          value={formatNumber(stats.overdue)}
          tone={stats.overdue > 0 ? "warning" : "default"}
          hint="Inadimplentes ou suspensas"
        />
        <StatCard
          label="Suspensas"
          value={formatNumber(stats.tenantsSuspended)}
          tone={stats.tenantsSuspended > 0 ? "danger" : "default"}
          hint="Site público fora do ar"
        />
        <StatCard label="Veículos" value={formatNumber(stats.vehicles)} hint="Em toda a base" />
        <StatCard
          label="Leads não atendidos"
          value={formatNumber(stats.leadsNew)}
          tone={stats.leadsNew > 0 ? "warning" : "default"}
          hint="Somando todas as revendas"
        />
      </StatGrid>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>Revendas recentes</CardTitle>
          <Link
            href="/super-admin/revendas"
            className="label-instrument text-muted transition-colors hover:text-text"
          >
            Ver todas
          </Link>
        </CardHeader>

        {recent.items.length === 0 ? (
          <EmptyState
            title="Nenhuma revenda cadastrada"
            description="Cadastre a primeira revenda para provisionar o painel e o site dela."
            action={
              <Link href="/super-admin/revendas/nova">
                <Button size="sm">Cadastrar revenda</Button>
              </Link>
            }
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Revenda</Th>
                <Th>Situação</Th>
                <Th>Financeiro</Th>
                <Th numeric>Vencimento</Th>
                <Th numeric>Criada em</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {recent.items.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td>
                    <Link
                      href={`/super-admin/revendas/${tenant.id}`}
                      className="font-medium text-text transition-colors hover:text-accent-text"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-faint">/r/{tenant.slug}</p>
                  </Td>
                  <Td>
                    <TenantStatusBadge status={tenant.status} />
                  </Td>
                  <Td>
                    <BillingStatusBadge status={tenant.billingStatus} />
                  </Td>
                  <Td numeric>{formatDate(tenant.currentDueDate)}</Td>
                  <Td numeric>{formatDate(tenant.createdAt)}</Td>
                  {/* mesma ação da lista de revendas: quem chega por aqui não
                      deveria ter que descobrir que o nome é clicável */}
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
    </>
  );
}
