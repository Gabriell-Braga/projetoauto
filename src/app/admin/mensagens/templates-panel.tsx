"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, FormField, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPatch, apiPost, fieldErrorsFrom, type FieldErrors } from "@/lib/client/api";
import {
  firstName,
  renderTemplate,
  TEMPLATE_VARIABLES,
  unknownVariables,
  type TemplateContext,
} from "@/lib/integrations/message-templates";

export type TemplateRow = { id: string; name: string; body: string; active: boolean };

export function TemplatesPanel({
  templates,
  canWrite,
  example,
}: {
  templates: TemplateRow[];
  canWrite: boolean;
  example: TemplateContext;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<TemplateRow | null>(null);

  const context: TemplateContext = {
    ...example,
    primeiro_nome: example.nome ? firstName(example.nome) : null,
  };

  async function handleDelete(template: TemplateRow) {
    const confirmed = await confirm({
      title: "Excluir modelo",
      description: `"${template.name}" some da lista. Mensagens já enviadas continuam no histórico.`,
      confirmLabel: "Excluir modelo",
      tone: "danger",
    });
    if (!confirmed) return;

    const result = await apiDelete(`/api/admin/message-templates/${template.id}`);
    if (!result.ok) {
      toast.error("Não consegui excluir", result.error);
      return;
    }
    toast.success("Modelo excluído");
    router.refresh();
  }

  async function toggleActive(template: TemplateRow, active: boolean) {
    const result = await apiPatch(`/api/admin/message-templates/${template.id}`, { active });
    if (!result.ok) {
      toast.error("Não consegui salvar", result.error);
      return;
    }
    router.refresh();
  }

  return (
    <>
      <Card className="mb-4">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Modelos de WhatsApp</CardTitle>
            <CardDescription>
              Escreva com variáveis entre chaves duplas e o sistema troca pelos dados do lead na
              hora do envio. O vendedor ainda pode ajustar o texto antes de mandar.
            </CardDescription>
          </div>
          {canWrite ? (
            <Button
              type="button"
              className="shrink-0"
              onClick={() => setEditing({ id: "", name: "", body: "", active: true })}
            >
              <Plus className="h-3.5 w-3.5" />
              Novo modelo
            </Button>
          ) : null}
        </CardHeader>

        <CardContent>
          {templates.length === 0 ? (
            <EmptyState title="Nenhum modelo" description="Crie o primeiro para agilizar o contato." />
          ) : (
            <ul className="flex flex-col gap-3">
              {templates.map((template) => (
                <li key={template.id} className="rounded border border-border bg-surface-2 p-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text">{template.name}</span>
                      {!template.active ? <Badge tone="neutral">Inativo</Badge> : null}
                    </div>

                    {canWrite ? (
                      <div className="flex items-center gap-1">
                        <label className="mr-2 flex items-center gap-1.5 text-xs text-muted">
                          <Checkbox
                            checked={template.active}
                            onChange={(event) => void toggleActive(template, event.target.checked)}
                          />
                          Ativo
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(template)}
                          aria-label={`Editar ${template.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
                          aria-label={`Excluir ${template.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>

                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                    {template.body}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap border-t border-border pt-2 text-[13px] leading-relaxed text-text">
                    {renderTemplate(template.body, context)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variáveis disponíveis</CardTitle>
          <CardDescription>
            Escreva o nome entre chaves duplas. O que não tiver valor no lead simplesmente some do
            texto, sem deixar buraco.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 sm:grid-cols-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <li key={variable.key} className="flex items-baseline gap-2 text-[13px]">
                <code className="rounded-sm bg-surface-2 px-1.5 py-0.5 text-xs text-accent-text">
                  {`{{${variable.key}}}`}
                </code>
                <span className="text-muted">{variable.label}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {editing ? (
        <TemplateEditor
          template={editing}
          context={context}
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

function TemplateEditor({
  template,
  context,
  onClose,
  onSaved,
}: {
  template: TemplateRow;
  context: TemplateContext;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const isNew = !template.id;
  const [name, setName] = useState(template.name);
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  // a prévia usa um lead de exemplo: é como quem escreve confere o resultado
  // antes de a mensagem chegar num cliente de verdade
  const preview = useMemo(() => renderTemplate(body, context), [body, context]);
  const unknown = useMemo(() => unknownVariables(body), [body]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = { name: name.trim(), body: body.trim() };
    const result = isNew
      ? await apiPost("/api/admin/message-templates", payload)
      : await apiPatch(`/api/admin/message-templates/${template.id}`, payload);

    setSaving(false);

    if (!result.ok) {
      setErrors(fieldErrorsFrom(result.details));
      toast.error(isNew ? "Não consegui criar" : "Não consegui salvar", result.error);
      return;
    }
    toast.success(isNew ? "Modelo criado" : "Modelo salvo");
    onSaved();
  }

  return (
    <Dialog
      open
      size="md"
      onClose={onClose}
      title={isNew ? "Novo modelo" : `Editar ${template.name}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="template-form" loading={saving}>
            {isNew ? "Criar modelo" : "Salvar"}
          </Button>
        </div>
      }
    >
      <form id="template-form" onSubmit={handleSubmit} noValidate>
        <FormField label="Nome" htmlFor="template-name" error={errors.name}>
          <Input
            id="template-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Primeiro contato"
          />
        </FormField>

        <FormField
          label="Mensagem"
          htmlFor="template-body"
          hint="Use {{primeiro_nome}}, {{veiculo}}, {{preco}}, {{vendedor}} e {{revenda}}."
          error={errors.body}
        >
          <Textarea
            id="template-body"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </FormField>

        {unknown.length > 0 ? (
          <Alert tone="warning" className="mb-4">
            Estas variáveis não existem e vão sumir do texto: {unknown.join(", ")}. Confira se
            escreveu o nome certo.
          </Alert>
        ) : null}

        <div>
          <p className="label-instrument mb-1.5 text-muted">Como o cliente vai receber</p>
          <p className="whitespace-pre-wrap rounded border border-border bg-surface-2 p-3 text-[13px] leading-relaxed text-text">
            {preview || "—"}
          </p>
        </div>
      </form>
    </Dialog>
  );
}
