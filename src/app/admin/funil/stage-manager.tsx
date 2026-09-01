"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPatch, apiPost, apiPut } from "@/lib/client/api";

type Stage = { id: string; name: string; kind: "open" | "won" | "lost"; count: number };

const KIND_LABELS = {
  open: "Em andamento",
  won: "Fecha como ganho",
  lost: "Fecha como perdido",
} as const;

export function StageManager({
  stages,
  onClose,
  onSaved,
}: {
  stages: Stage[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState(stages);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<Stage["kind"]>("open");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (newName.trim().length < 2) {
      toast.error("Dê um nome à etapa");
      return;
    }
    setBusy(true);
    const result = await apiPost<{ id: string }>("/api/admin/pipeline/stages", {
      name: newName.trim(),
      kind: newKind,
    });
    setBusy(false);

    if (!result.ok) {
      toast.error("Não consegui criar", result.error);
      return;
    }
    setItems([...items, { id: result.data.id, name: newName.trim(), kind: newKind, count: 0 }]);
    setNewName("");
    toast.success("Etapa criada");
  }

  async function handleRename(stage: Stage, name: string) {
    setItems(items.map((item) => (item.id === stage.id ? { ...item, name } : item)));
    const result = await apiPatch(`/api/admin/pipeline/stages/${stage.id}`, { name });
    if (!result.ok) toast.error("Não consegui renomear", result.error);
  }

  async function handleDelete(stage: Stage) {
    const confirmed = await confirm({
      title: "Excluir etapa",
      description:
        stage.count > 0
          ? `${stage.count} lead(s) desta etapa voltam para a primeira etapa em andamento.`
          : "A etapa está vazia e será removida.",
      confirmLabel: "Excluir etapa",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusy(true);
    const result = await apiDelete(`/api/admin/pipeline/stages/${stage.id}`);
    setBusy(false);

    if (!result.ok) {
      toast.error("Não consegui excluir", result.error);
      return;
    }
    setItems(items.filter((item) => item.id !== stage.id));
    toast.success("Etapa excluída");
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);

    const result = await apiPut("/api/admin/pipeline/stages", {
      stageIds: next.map((item) => item.id),
    });
    if (!result.ok) {
      setItems(items);
      toast.error("Não consegui reordenar", result.error);
    }
  }

  return (
    <Dialog
      open
      size="md"
      onClose={onClose}
      title="Etapas do funil"
      description="A ordem aqui é a ordem das colunas no quadro."
      footer={
        <div className="flex justify-end">
          <Button type="button" onClick={onSaved}>
            Concluir
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {items.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-2">
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Subir ${stage.name}`}
                disabled={index === 0}
                onClick={() => void move(index, -1)}
                className="text-faint hover:text-text disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                aria-label={`Descer ${stage.name}`}
                disabled={index === items.length - 1}
                onClick={() => void move(index, 1)}
                className="text-faint hover:text-text disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>

            <Input
              value={stage.name}
              aria-label={`Nome da etapa ${stage.name}`}
              onChange={(event) =>
                setItems(items.map((item) => (item.id === stage.id ? { ...item, name: event.target.value } : item)))
              }
              onBlur={(event) => void handleRename(stage, event.target.value)}
            />

            <span className="w-32 shrink-0 text-xs text-faint">{KIND_LABELS[stage.kind]}</span>
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-faint">
              {stage.count}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || items.length <= 1}
              onClick={() => void handleDelete(stage)}
              aria-label={`Excluir ${stage.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Alert tone="info" className="mb-3">
          Etapas de ganho e perda fecham o funil e alimentam a taxa de conversão.
        </Alert>
        <div className="flex flex-wrap items-end gap-2">
          <FormField label="Nova etapa" htmlFor="stage-name" className="mb-0 flex-1">
            <Input
              id="stage-name"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Negociação"
            />
          </FormField>
          <FormField label="Tipo" htmlFor="stage-kind" className="mb-0">
            <Select
              id="stage-kind"
              value={newKind}
              onChange={(event) => setNewKind(event.target.value as Stage["kind"])}
            >
              <option value="open">Em andamento</option>
              <option value="won">Fecha como ganho</option>
              <option value="lost">Fecha como perdido</option>
            </Select>
          </FormField>
          <Button type="button" loading={busy} onClick={handleAdd}>
            <Plus className="h-3.5 w-3.5" />
            Adicionar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
