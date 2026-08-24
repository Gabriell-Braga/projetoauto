"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { apiPatch, apiPost, apiPut } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";
import type { Role } from "@/db/schema";

export type TenantUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

const ASSIGNABLE: Role[] = ["revenda_admin", "vendedor", "visualizador"];

export function TenantUsersPanel({
  tenantId,
  users,
}: {
  tenantId: string;
  users: TenantUserRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await apiPost(`/api/super-admin/tenants/${tenantId}/users`, {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      role: String(form.get("role") ?? "revenda_admin"),
      password: String(form.get("password") ?? ""),
      mustChangePassword: true,
    });

    setCreating(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    formElement.reset();
    toast.success("Usuário criado. Envie a senha provisória para a revenda.");
    router.refresh();
  }

  async function handleToggleStatus(user: TenantUserRow) {
    setBusyId(user.id);
    const result = await apiPatch(`/api/super-admin/users/${user.id}`, {
      status: user.status === "active" ? "disabled" : "active",
    });
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(user.status === "active" ? "Acesso desativado." : "Acesso reativado.");
    router.refresh();
  }

  async function handleResetPassword(user: TenantUserRow) {
    const password = window.prompt(
      `Nova senha provisória para ${user.email} (mínimo 8 caracteres):`,
    );
    if (!password) return;

    setBusyId(user.id);
    const result = await apiPut(`/api/super-admin/users/${user.id}`, {
      password,
      mustChangePassword: true,
    });
    setBusyId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Senha redefinida. Sessões de ${user.email} encerradas.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Usuários da revenda</CardTitle>
        </CardHeader>
        {users.length === 0 ? (
          <EmptyState
            title="Nenhum usuário"
            description="Crie o acesso do responsável para a revenda começar a usar o painel."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Usuário</Th>
                <Th>Perfil</Th>
                <Th>Situação</Th>
                <Th numeric>Último acesso</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium text-text">{user.name}</p>
                    <p className="text-xs text-faint">{user.email}</p>
                  </Td>
                  <Td className="text-muted">{ROLE_LABELS[user.role]}</Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={user.status === "active" ? "success" : "neutral"}>
                        {user.status === "active" ? "Ativo" : "Desativado"}
                      </Badge>
                      {user.mustChangePassword ? (
                        <Badge tone="warning">Senha provisória</Badge>
                      ) : null}
                    </div>
                  </Td>
                  <Td numeric className="text-muted">
                    {user.lastLoginAt
                      ? formatDateTime(new Date(user.lastLoginAt))
                      : "Nunca acessou"}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        loading={busyId === user.id}
                        onClick={() => handleResetPassword(user)}
                      >
                        Redefinir senha
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={user.status === "active" ? "outlineDanger" : "secondary"}
                        loading={busyId === user.id}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.status === "active" ? "Desativar" : "Reativar"}
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar acesso</CardTitle>
          <CardDescription>
            A senha é provisória: a pessoa é obrigada a trocar no primeiro acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
              <FormField label="Nome" htmlFor="user-name">
                <Input id="user-name" name="name" required />
              </FormField>
              <FormField label="E-mail" htmlFor="user-email">
                <Input id="user-email" name="email" type="email" required />
              </FormField>
              <FormField label="Perfil" htmlFor="user-role">
                <Select id="user-role" name="role" defaultValue="revenda_admin">
                  {ASSIGNABLE.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Senha provisória" htmlFor="user-password" hint="Mínimo 8 caracteres">
                <Input id="user-password" name="password" minLength={8} required />
              </FormField>
            </div>

            <Button type="submit" loading={creating}>
              Criar usuário
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
