import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { listAuditActions, listAuditLog } from "@/lib/services/audit";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Auditoria" };
export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Login",
  "auth.logout": "Logout",
  "platform.bootstrap": "Bootstrap da plataforma",
  "tenant.create": "Revenda criada",
  "tenant.update": "Revenda atualizada",
  "tenant.delete": "Revenda excluída",
  "tenant.user.create": "Usuário da revenda criado",
  "user.update": "Usuário atualizado",
  "user.reset_password": "Senha redefinida",
  "billing.update": "Financeiro atualizado",
  "billing.payment": "Pagamento registrado",
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

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const currentPage = result.page;

  function pageHref(page: number) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.action) query.set("action", params.action);
    query.set("page", String(page));
    return `/super-admin/auditoria?${query.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Auditoria"
        description={`${result.total} registro(s). Toda ação sensível da plataforma fica aqui.`}
      />

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3 px-5 py-4" action="/super-admin/auditoria">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="q">
              Buscar por e-mail ou ação
            </label>
            <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="admin@..." />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="action">
              Ação
            </label>
            <Select id="action" name="action" defaultValue={params.action ?? ""}>
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
                <Th>Quando</Th>
                <Th>Ação</Th>
                <Th>Responsável</Th>
                <Th>Revenda</Th>
                <Th>Detalhes</Th>
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((item) => (
                <Tr key={item.id}>
                  <Td className="whitespace-nowrap text-xs">{formatDateTime(item.createdAt)}</Td>
                  <Td>
                    <span className="text-sm">{ACTION_LABELS[item.action] ?? item.action}</span>
                    {item.impersonated ? (
                      <Badge tone="warning" className="ml-2">
                        impersonation
                      </Badge>
                    ) : null}
                  </Td>
                  <Td className="text-xs">{item.actorEmail ?? "—"}</Td>
                  <Td className="text-xs">
                    {item.tenantId ? (
                      <Link
                        href={`/super-admin/revendas/${item.tenantId}`}
                        className="text-brand-600 hover:underline"
                      >
                        {item.tenantName ?? item.tenantId}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="max-w-80 truncate text-xs text-ink-500">
                    {item.metadata ? JSON.stringify(item.metadata) : "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {currentPage > 1 ? (
            <Link href={pageHref(currentPage - 1)} className="text-brand-600 hover:underline">
              Anterior
            </Link>
          ) : null}
          <span className="text-ink-500">
            Página {currentPage} de {totalPages}
          </span>
          {currentPage < totalPages ? (
            <Link href={pageHref(currentPage + 1)} className="text-brand-600 hover:underline">
              Próxima
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
