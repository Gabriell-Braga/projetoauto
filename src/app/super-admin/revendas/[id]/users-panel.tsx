"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setMessage(null);

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
      setError(result.error);
      return;
    }
    formElement.reset();
    setMessage("Usuário criado. Envie a senha provisória para a revenda.");
    router.refresh();
  }

  async function handleToggleStatus(user: TenantUserRow) {
    setBusyUserId(user.id);
    setError(null);
    setMessage(null);

    const result = await apiPatch(`/api/super-admin/users/${user.id}`, {
      status: user.status === "active" ? "disabled" : "active",
    });

    setBusyUserId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleResetPassword(user: TenantUserRow) {
    const password = window.prompt(
      `Nova senha provisória para ${user.email} (mínimo 8 caracteres):`,
    );
    if (!password) return;

    setBusyUserId(user.id);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/super-admin/users/${user.id}`, {
      password,
      mustChangePassword: true,
    });

    setBusyUserId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Senha redefinida. As sessões ativas de ${user.email} foram encerradas.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

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
                <Th>Último acesso</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {users.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <p className="font-medium text-ink-900">{user.name}</p>
                    <p className="text-xs text-ink-500">{user.email}</p>
                  </Td>
                  <Td>{ROLE_LABELS[user.role]}</Td>
                  <Td>
                    <Badge tone={user.status === "active" ? "success" : "neutral"}>
                      {user.status === "active" ? "Ativo" : "Desativado"}
                    </Badge>
                    {user.mustChangePassword ? (
                      <Badge tone="warning" className="ml-1">
                        senha provisória
                      </Badge>
                    ) : null}
                  </Td>
                  <Td className="text-xs">
                    {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : "Nunca acessou"}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyUserId === user.id}
                        onClick={() => handleResetPassword(user)}
                      >
                        Redefinir senha
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={user.status === "active" ? "outlineDanger" : "secondary"}
                        disabled={busyUserId === user.id}
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
            A senha é provisória: o usuário será obrigado a trocá-la no primeiro acesso.
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

            <Button type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar usuário"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
