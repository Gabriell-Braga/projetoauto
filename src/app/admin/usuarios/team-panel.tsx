"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import type { Role } from "@/db/schema";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { useToast } from "@/components/ui/toast";
import { apiPatch, apiPost, apiPut } from "@/lib/client/api";
import { formatDateTime } from "@/lib/utils";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "disabled";
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

const ROLE_HINTS: Record<string, string> = {
  revenda_admin: "Acesso total ao painel da revenda, inclusive site e usuários.",
  vendedor: "Gerencia estoque e leads. Não mexe nas configurações do site nem em usuários.",
  visualizador: "Somente leitura em estoque, leads e configurações.",
};

export function TeamPanel({
  members,
  currentUserId,
  assignableRoles,
  canWrite,
}: {
  members: TeamMember[];
  currentUserId: string;
  assignableRoles: Role[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const result = await apiPost("/api/admin/users", {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      role: String(form.get("role") ?? "vendedor"),
      password: String(form.get("password") ?? ""),
      mustChangePassword: true,
    });

    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    formElement.reset();
    toast.success("Usuário criado. Passe a senha provisória para a pessoa.");
    router.refresh();
  }

  async function patchUser(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    const result = await apiPatch(`/api/admin/users/${id}`, payload);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Acesso atualizado.");
    router.refresh();
  }

  async function resetPassword(member: TeamMember) {
    const password = window.prompt(
      `Nova senha provisória para ${member.email} (mínimo 8 caracteres):`,
    );
    if (!password) return;

    setBusy(true);
    const result = await apiPut(`/api/admin/users/${member.id}`, {
      password,
      mustChangePassword: true,
    });
    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`Senha redefinida. As sessões de ${member.email} foram encerradas.`);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>Quem tem acesso ao painel da sua revenda.</CardDescription>
        </CardHeader>
        <Table>
          <Thead>
            <Tr>
              <Th>Pessoa</Th>
              <Th>Perfil</Th>
              <Th>Situação</Th>
              <Th numeric>Último acesso</Th>
              <Th />
            </Tr>
          </Thead>
          <tbody>
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              return (
                <Tr key={member.id}>
                  <Td>
                    <p className="font-medium text-text">
                      {member.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs font-normal text-faint">(você)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">{member.email}</p>
                  </Td>
                  <Td>
                    {canWrite && !isSelf ? (
                      <Select
                        className="h-8 text-xs"
                        value={member.role}
                        disabled={busy}
                        onChange={(event) => patchUser(member.id, { role: event.target.value })}
                      >
                        {assignableRoles.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span className="text-muted">{ROLE_LABELS[member.role]}</span>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={member.status === "active" ? "success" : "neutral"}>
                      {member.status === "active" ? "Ativo" : "Desativado"}
                    </Badge>
                    {member.mustChangePassword ? (
                      <Badge tone="warning" className="ml-2">Senha provisória</Badge>
                    ) : null}
                  </Td>
                  <Td numeric className="text-muted">
                    {member.lastLoginAt
                      ? formatDateTime(new Date(member.lastLoginAt))
                      : "Nunca acessou"}
                  </Td>
                  <Td className="text-right">
                    {canWrite ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          loading={busy}
                          onClick={() => resetPassword(member)}
                        >
                          Redefinir senha
                        </Button>
                        {!isSelf ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={member.status === "active" ? "outlineDanger" : "secondary"}
                            loading={busy}
                            onClick={() =>
                              patchUser(member.id, {
                                status: member.status === "active" ? "disabled" : "active",
                              })
                            }
                          >
                            {member.status === "active" ? "Desativar" : "Reativar"}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar pessoa</CardTitle>
            <CardDescription>
              A senha é provisória: no primeiro acesso a pessoa é obrigada a trocar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate}>
              <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Nome" htmlFor="member-name">
                  <Input id="member-name" name="name" required />
                </FormField>
                <FormField label="E-mail" htmlFor="member-email">
                  <Input id="member-email" name="email" type="email" required />
                </FormField>
                <FormField label="Perfil" htmlFor="member-role">
                  <Select id="member-role" name="role" defaultValue="vendedor">
                    {assignableRoles.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField
                  label="Senha provisória"
                  htmlFor="member-password"
                  hint="Mínimo 8 caracteres"
                >
                  <Input id="member-password" name="password" minLength={8} required />
                </FormField>
              </div>

              <Button type="submit" loading={busy}>
                Criar acesso
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>O que cada perfil pode fazer</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-[13px] text-muted">
            {assignableRoles.map((role) => (
              <li key={role}>
                <strong className="font-medium text-text">{ROLE_LABELS[role]}:</strong> {ROLE_HINTS[role]}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
