import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { listPendingPasswordResets, listPlatformUsers } from "@/lib/services/users";
import { formatDateTime } from "@/lib/utils";
import { PlatformUsersPanel } from "./platform-users-panel";

export const metadata: Metadata = { title: "Usuários da plataforma" };
export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const context = await requireSuperAdminPage();
  const [users, pendingResets] = await Promise.all([
    listPlatformUsers(),
    listPendingPasswordResets(),
  ]);

  return (
    <>
      <PageHeader
        title="Usuários da plataforma"
        description="Equipe interna com acesso ao Painel Geral."
      />

      {pendingResets.length > 0 ? (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Pedidos de redefinição de senha</CardTitle>
            <CardDescription>
              O link é gerado com token de uso único e o banco guarda só o hash — nem a plataforma
              consegue recuperá-lo. Para destravar alguém sem e-mail configurado, use o botão
              &quot;Redefinir senha&quot; no cadastro da pessoa.
            </CardDescription>
          </CardHeader>
          <Table>
            <Thead>
              <Tr>
                <Th>Quem pediu</Th>
                <Th>Revenda</Th>
                <Th>Envio</Th>
                <Th numeric>Pedido em</Th>
                <Th numeric>Expira</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {pendingResets.map((reset) => (
                <Tr key={reset.id}>
                  <Td>
                    <p className="font-medium text-text">{reset.userName}</p>
                    <p className="text-xs text-faint">{reset.userEmail}</p>
                  </Td>
                  <Td className="text-muted">{reset.tenantName ?? "Plataforma"}</Td>
                  <Td>
                    <Badge tone={reset.delivered ? "success" : "warning"}>
                      {reset.delivered ? "E-mail enviado" : "Entrega manual"}
                    </Badge>
                  </Td>
                  <Td numeric className="text-muted">
                    {formatDateTime(reset.createdAt)}
                  </Td>
                  <Td numeric className="text-muted">
                    {formatDateTime(reset.expiresAt)}
                  </Td>
                  <Td className="text-right">
                    {reset.tenantName ? (
                      <Link
                        href="/super-admin/revendas"
                        className="text-[13px] text-accent-text hover:underline"
                      >
                        Abrir revenda
                      </Link>
                    ) : null}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      ) : null}

      <PlatformUsersPanel
        currentUserId={context.user.id}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
