import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { Pagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { listAuditActions, listAuditLog } from "@/lib/services/audit";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Auditoria" };
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Login",
  "auth.logout": "Logout",
  "auth.change_password": "Senha alterada",
  "platform.bootstrap": "Bootstrap da plataforma",
  "platform.user.create": "Super-admin criado",
  "platform.impersonate.start": "Entrou na revenda",
  "platform.impersonate.stop": "Saiu da revenda",
  "tenant.create": "Revenda criada",
  "tenant.update": "Revenda atualizada",
  "tenant.delete": "Revenda excluída",
  "tenant.user.create": "Usuário da revenda criado",
  "user.create": "Usuário criado",
  "user.update": "Usuário atualizado",
  "user.reset_password": "Senha redefinida",
  "billing.update": "Financeiro atualizado",
  "billing.payment": "Pagamento registrado",
  "vehicle.create": "Veículo cadastrado",
  "vehicle.update": "Veículo atualizado",
  "vehicle.delete": "Veículo excluído",
  "vehicle.photo.upload": "Foto enviada",
  "vehicle.photo.delete": "Foto removida",
  "lead.update": "Lead atualizado",
  "site.update": "Site atualizado",
  "site.logo.update": "Logo atualizada",
  "site.logo.delete": "Logo removida",
  "site.banner.create": "Banner criado",
  "site.banner.update": "Banner atualizado",
  "site.banner.delete": "Banner removido",
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; action?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [result, actions] = await Promise.all([
    listAuditLog({
      search: params.q?.trim() || undefined,
      action: params.action || undefined,
      page: Number(params.page ?? 1) || 1,
    }),
    listAuditActions(),
  ]);

  return (
    <>
      <PageHeader
        title="Auditoria"
        description={`${result.total} registro(s). Toda ação sensível da plataforma passa por aqui.`}
      />

      <Card className="mb-3">
        <form className="flex flex-wrap items-end gap-3 px-4 py-3.5" action="/super-admin/auditoria">
          <div className="min-w-56 flex-1">
            <Label htmlFor="q">Responsável ou ação</Label>
            <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="admin@…" />
          </div>
          <div>
            <Label htmlFor="action">Ação</Label>
            <Select id="action" name="action" defaultValue={params.action ?? ""} className="w-56">
              <option value="">Todas</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] ?? action}
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
          <EmptyState title="Nenhum registro" description="Ainda não há ações registradas." />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th numeric>Quando</Th>
                <Th>Ação</Th>
                <Th>Responsável</Th>
                <Th>Revenda</Th>
                <Th>Detalhes</Th>
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((item) => (
                <Tr key={item.id}>
                  <Td numeric className="whitespace-nowrap text-muted">
                    {formatDateTime(item.createdAt)}
                  </Td>
                  <Td>
                    <span className="text-text">{ACTION_LABELS[item.action] ?? item.action}</span>
                    {item.impersonated ? (
                      <Badge tone="warning" className="ml-2">
                        impersonation
                      </Badge>
                    ) : null}
                  </Td>
                  <Td className="text-muted">{item.actorEmail ?? "—"}</Td>
                  <Td>
                    {item.tenantId ? (
                      <Link
                        href={`/super-admin/revendas/${item.tenantId}`}
                        className="text-muted transition-colors hover:text-accent-text"
                      >
                        {item.tenantName ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-faint">Plataforma</span>
                    )}
                  </Td>
                  <Td className="max-w-80 truncate text-xs text-faint">
                    {item.metadata ? JSON.stringify(item.metadata) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Pagination
        basePath="/super-admin/auditoria"
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        params={{ q: params.q, action: params.action }}
      />
    </>
  );
}
