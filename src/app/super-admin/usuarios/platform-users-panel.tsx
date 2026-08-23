"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { apiPatch, apiPost, apiPut } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

export function PlatformUsersPanel({
  users,
  currentUserId,
}: {
  users: PlatformUserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await apiPost("/api/super-admin/users", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    formElement.reset();
    setMessage("Super-admin criado com senha provisória.");
    router.refresh();
  }

  async function handleToggle(user: PlatformUserRow) {
    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await apiPatch(`/api/super-admin/users/${user.id}`, {
      status: user.status === "active" ? "disabled" : "active",
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleReset(user: PlatformUserRow) {
    const password = window.prompt(`Nova senha para ${user.email} (mínimo 8 caracteres):`);
    if (!password) return;

    setBusy(true);
    setError(null);
    setMessage(null);

    const result = await apiPut(`/api/super-admin/users/${user.id}`, {
      password,
      mustChangePassword: true,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("Senha redefinida e sessões encerradas.");
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
          <CardTitle>Super-admins</CardTitle>
          <CardDescription>Usuários com acesso total à plataforma.</CardDescription>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Usuário</Th>
              <Th>Situação</Th>
              <Th>Último acesso</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <p className="font-medium text-ink-900">
                    {user.name}
                    {user.id === currentUserId ? (
                      <span className="ml-2 text-xs font-normal text-ink-500">(você)</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-500">{user.email}</p>
                </Td>
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
                      disabled={busy}
                      onClick={() => handleReset(user)}
                    >
                      Redefinir senha
                    </Button>
                    {user.id !== currentUserId ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={user.status === "active" ? "outlineDanger" : "secondary"}
                        disabled={busy}
                        onClick={() => handleToggle(user)}
                      >
                        {user.status === "active" ? "Desativar" : "Reativar"}
                      </Button>
                    ) : null}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo super-admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <div className="grid gap-x-4 sm:grid-cols-3">
              <FormField label="Nome" htmlFor="sa-name">
                <Input id="sa-name" name="name" required />
              </FormField>
              <FormField label="E-mail" htmlFor="sa-email">
                <Input id="sa-email" name="email" type="email" required />
              </FormField>
              <FormField label="Senha provisória" htmlFor="sa-password" hint="Mínimo 8 caracteres">
                <Input id="sa-password" name="password" minLength={8} required />
              </FormField>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Criando..." : "Criar super-admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
