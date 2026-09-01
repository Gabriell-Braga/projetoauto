"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, FormField, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/client/api";
import { PERMISSION_LABELS, TENANT_PERMISSIONS, can } from "@/lib/auth/rbac";
import type { TeamMember } from "./team-panel";

/**
 * Ajustes de uma pessoa: unidade, rodízio e permissões.
 *
 * As permissões aparecem como o que o perfil já dá, marcado, e o que ele não
 * dá, desmarcado. Desmarcar algo do perfil vira revogação; marcar algo de fora
 * vira concessão. A pessoa que opera não precisa entender "granted/revoked" —
 * ela só marca o que a pessoa pode fazer.
 */
export function MemberTuning({
  member,
  stores,
  showDistribution,
  showPermissions,
  onClose,
  onSaved,
}: {
  member: TeamMember;
  stores: { id: string; name: string }[];
  showDistribution: boolean;
  showPermissions: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [storeId, setStoreId] = useState(member.storeId ?? "");
  const [receivesLeads, setReceivesLeads] = useState(member.receivesLeads);
  const [saving, setSaving] = useState(false);

  const [allowed, setAllowed] = useState<Set<string>>(() => {
    const base = new Set<string>();
    for (const permission of TENANT_PERMISSIONS) {
      const fromRole = can(member.role, permission);
      const granted = member.permissionOverrides?.granted?.includes(permission) ?? false;
      const revoked = member.permissionOverrides?.revoked?.includes(permission) ?? false;
      if ((fromRole || granted) && !revoked) base.add(permission);
    }
    return base;
  });

  function toggle(permission: string, checked: boolean) {
    setAllowed((current) => {
      const next = new Set(current);
      if (checked) next.add(permission);
      else next.delete(permission);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    // guardamos a diferença em relação ao perfil, não a lista inteira: assim a
    // pessoa continua herdando mudanças futuras do perfil dela
    const granted: string[] = [];
    const revoked: string[] = [];
    for (const permission of TENANT_PERMISSIONS) {
      const fromRole = can(member.role, permission);
      const now = allowed.has(permission);
      if (now && !fromRole) granted.push(permission);
      if (!now && fromRole) revoked.push(permission);
    }

    const payload: Record<string, unknown> = {
      storeId: storeId || null,
      receivesLeads,
    };
    if (showPermissions) {
      payload.permissionOverrides =
        granted.length === 0 && revoked.length === 0 ? null : { granted, revoked };
    }

    const result = await apiPatch(`/api/admin/users/${member.id}`, payload);
    setSaving(false);

    if (!result.ok) {
      toast.error("Não consegui salvar", result.error);
      return;
    }
    toast.success("Ajustes salvos", member.name);
    onSaved();
  }

  const deviations = TENANT_PERMISSIONS.filter(
    (permission) => allowed.has(permission) !== can(member.role, permission),
  ).length;

  return (
    <Dialog
      open
      size="md"
      onClose={onClose}
      title={`Ajustes de ${member.name}`}
      description="Valem só para esta pessoa, sem mudar o perfil dela."
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="tuning-form" loading={saving}>
            Salvar ajustes
          </Button>
        </div>
      }
    >
      <form id="tuning-form" onSubmit={handleSubmit} noValidate>
        {stores.length > 0 ? (
          <FormField
            label="Unidade"
            htmlFor="tuning-store"
            hint="Sem unidade, a pessoa atende a revenda toda."
          >
            <Select
              id="tuning-store"
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
            >
              <option value="">Todas as unidades</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}

        {showDistribution ? (
          <label className="mb-4 flex items-start gap-2 text-[13px] text-text">
            <Checkbox
              className="mt-0.5"
              checked={receivesLeads}
              onChange={(event) => setReceivesLeads(event.target.checked)}
            />
            <span>
              Entra no rodízio de leads
              <span className="block text-xs text-faint">
                Desmarque para quem está de férias ou não atende — o rodízio pula essa pessoa.
              </span>
            </span>
          </label>
        ) : null}

        {showPermissions ? (
          <fieldset className="border-t border-border pt-4">
            <legend className="label-instrument mb-2 text-muted">O que pode fazer</legend>
            <p className="mb-3 text-xs text-faint">
              Marcado é o que a pessoa pode. O perfil dela já define uma base;{" "}
              {deviations === 0
                ? "nada foi alterado."
                : `${deviations} item(ns) fogem do perfil.`}
            </p>

            <div className="grid gap-1.5 sm:grid-cols-2">
              {TENANT_PERMISSIONS.map((permission) => {
                const fromRole = can(member.role, permission);
                const now = allowed.has(permission);
                const changed = now !== fromRole;
                return (
                  <label
                    key={permission}
                    className="flex items-center gap-2 text-[13px] text-text"
                  >
                    <Checkbox
                      checked={now}
                      onChange={(event) => toggle(permission, event.target.checked)}
                    />
                    <span>
                      {PERMISSION_LABELS[permission] ?? permission}
                      {changed ? (
                        <span className="ml-1.5 text-[11px] uppercase tracking-wide text-accent-text">
                          {now ? "extra" : "removido"}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>

            {allowed.size === 0 ? (
              <Alert tone="warning" className="mt-3">
                Sem nenhuma permissão a pessoa consegue entrar, mas não vê nada.
              </Alert>
            ) : null}
          </fieldset>
        ) : null}
      </form>
    </Dialog>
  );
}

