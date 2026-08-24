"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input } from "@/components/ui/field";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
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
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await apiPost("/api/super-admin/users", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });

    setCreating(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    formElement.reset();
    toast.success("Super-admin criado com senha provisória.");
    router.refresh();
  }

  async function handleToggle(user: PlatformUserRow) {
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

  async function handleReset(user: PlatformUserRow) {
    const password = window.prompt(`Nova senha para ${user.email} (mínimo 8 caracteres):`);
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
    toast.success("Senha redefinida e sessões encerradas.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Super-admins</CardTitle>
          <CardDescription>Equipe interna com acesso total à plataforma.</CardDescription>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Usuário</Th>
              <Th>Situação</Th>
              <Th numeric>Último acesso</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {users.map((user) => (
              <Tr key={user.id}>
                <Td>
                  <p className="font-medium text-text">
                    {user.name}
                    {user.id === currentUserId ? (
                      <span className="ml-2 text-xs font-normal text-faint">você</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-faint">{user.email}</p>
                </Td>
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
                  {user.lastLoginAt ? formatDateTime(new Date(user.lastLoginAt)) : "Nunca acessou"}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      loading={busyId === user.id}
                      onClick={() => handleReset(user)}
                    >
                      Redefinir senha
                    </Button>
                    {user.id !== currentUserId ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={user.status === "active" ? "outlineDanger" : "secondary"}
                        loading={busyId === user.id}
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
          <CardDescription>
            A senha é provisória: a pessoa troca no primeiro acesso.
          </CardDescription>
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
            <Button type="submit" loading={creating}>
              Criar super-admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
