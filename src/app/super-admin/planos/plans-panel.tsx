"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { apiDelete } from "@/lib/client/api";
import { FEATURES } from "@/lib/plans/catalog";
import { formatCurrency } from "@/lib/utils";
import { CouponsPanel, type CouponRow } from "./coupons-panel";
import { PlanEditor, type PlanRow } from "./plan-editor";

const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUALLY: "Semestral",
  YEARLY: "Anual",
};

/** Quantas funcionalidades o plano liga, sobre o total do catálogo. */
function featureCount(features: Record<string, unknown> | null): number {
  if (!features) return 0;
  return FEATURES.filter((feature) => {
    const value = features[feature.key];
    return value !== undefined && value !== null && value !== false && value !== 0 && value !== "";
  }).length;
}

export function PlansPanel({ plans, coupons }: { plans: PlanRow[]; coupons: CouponRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(plan: PlanRow) {
    if (plan.tenantCount > 0) {
      toast.error(
        "Plano em uso",
        `${plan.tenantCount} revenda(s) estão neste plano. Mova-as antes de excluir.`,
      );
      return;
    }
    if (!window.confirm(`Excluir o plano "${plan.name}"? Isso não pode ser desfeito.`)) return;

    setDeletingId(plan.id);
    const result = await apiDelete(`/api/super-admin/plans/${plan.id}`);
    setDeletingId(null);

    if (!result.ok) {
      toast.error("Não foi possível excluir", result.error);
      return;
    }
    toast.success("Plano excluído", plan.name);
    router.refresh();
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Planos comerciais</CardTitle>
            <CardDescription>
              Alterar limites e funcionalidades vale na hora para quem já está no plano. O preço só
              afeta contratações novas — quem já assinou mantém o valor pactuado no gateway.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => setCreating(true)} className="shrink-0">
            <Plus className="h-3.5 w-3.5" />
            Novo plano
          </Button>
        </CardHeader>

        {plans.length === 0 ? (
          <EmptyState
            title="Nenhum plano cadastrado"
            description="Sem plano, a revenda funciona sem limites definidos."
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Plano</Th>
                <Th numeric>Preço</Th>
                <Th>Ciclo</Th>
                <Th numeric>Trial</Th>
                <Th>Cobrança</Th>
                <Th numeric>Revendas</Th>
                <Th numeric>Recursos</Th>
                <Th>Situação</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td>
                    <div className="font-medium text-text">{plan.name}</div>
                    <div className="text-xs text-faint">{plan.slug}</div>
                  </Td>
                  <Td numeric>{formatCurrency(plan.priceCents)}</Td>
                  <Td>{CYCLE_LABELS[plan.cycle] ?? plan.cycle}</Td>
                  <Td numeric>{plan.trialDays > 0 ? `${plan.trialDays} d` : "—"}</Td>
                  <Td>{plan.billingMode === "gateway" ? "Automática" : "Negociada"}</Td>
                  <Td numeric>{plan.tenantCount}</Td>
                  <Td numeric>
                    {featureCount(plan.features)}/{FEATURES.length}
                  </Td>
                  <Td>
                    <Badge tone={plan.active ? "success" : "neutral"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(plan)}
                        aria-label={`Editar ${plan.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        loading={deletingId === plan.id}
                        onClick={() => handleDelete(plan)}
                        aria-label={`Excluir ${plan.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <CouponsPanel coupons={coupons} plans={plans} />

      {creating ? (
        <PlanEditor
          plan={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      ) : null}

      {editing ? (
        <PlanEditor
          plan={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}
