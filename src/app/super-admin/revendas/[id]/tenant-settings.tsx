"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TemplatePicker } from "@/components/admin/template-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select, Textarea } from "@/components/ui/field";
import { apiPatch } from "@/lib/client/api";
import { slugify } from "@/lib/utils";

export type TenantSettingsValues = {
  id: string;
  name: string;
  slug: string;
  legalName: string | null;
  cnpj: string | null;
  status: "active" | "suspended";
  templateId: string;
  blockMode: "readonly" | "full";
  notes: string | null;
  gtmCode: string | null;
};

export function TenantSettingsForm({ tenant }: { tenant: TenantSettingsValues }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [slug, setSlug] = useState(tenant.slug);
  const [templateId, setTemplateId] = useState(tenant.templateId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const form = new FormData(event.currentTarget);
    const result = await apiPatch(`/api/super-admin/tenants/${tenant.id}`, {
      name: String(form.get("name") ?? ""),
      slug,
      templateId,
      legalName: String(form.get("legalName") ?? ""),
      cnpj: String(form.get("cnpj") ?? ""),
      status: String(form.get("status") ?? "active"),
      blockMode: String(form.get("blockMode") ?? "readonly"),
      notes: String(form.get("notes") ?? ""),
      gtmCode: String(form.get("gtmCode") ?? ""),
    });

    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaved(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label="Nome da revenda" htmlFor="name">
              <Input id="name" name="name" defaultValue={tenant.name} required />
            </FormField>

            <FormField label="Slug" htmlFor="slug" hint={`Site em /r/${slug}`}>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                required
              />
            </FormField>

            <FormField label="Razão social" htmlFor="legalName">
              <Input id="legalName" name="legalName" defaultValue={tenant.legalName ?? ""} />
            </FormField>

            <FormField label="CNPJ" htmlFor="cnpj">
              <Input id="cnpj" name="cnpj" defaultValue={tenant.cnpj ?? ""} />
            </FormField>

            <FormField
              label="Situação"
              htmlFor="status"
              hint="Suspender derruba o site público imediatamente"
            >
              <Select id="status" name="status" defaultValue={tenant.status}>
                <option value="active">Ativa</option>
                <option value="suspended">Suspensa</option>
              </Select>
            </FormField>

            <FormField label="Bloqueio na suspensão" htmlFor="blockMode">
              <Select id="blockMode" name="blockMode" defaultValue={tenant.blockMode}>
                <option value="readonly">Somente leitura</option>
                <option value="full">Bloqueio total</option>
              </Select>
            </FormField>
          </div>

          <FormField
            label="Código GTM"
            htmlFor="gtmCode"
            hint="Formato GTM-XXXXXXX. A revenda pode sobrescrever pelo painel dela."
          >
            <Input id="gtmCode" name="gtmCode" defaultValue={tenant.gtmCode ?? ""} placeholder="GTM-ABC1234" />
          </FormField>

          <FormField label="Observações internas" htmlFor="notes" className="mb-0">
            <Textarea id="notes" name="notes" defaultValue={tenant.notes ?? ""} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template do site</CardTitle>
          <CardDescription>
            Trocar o template não apaga nenhum dado — só muda a apresentação do site público.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplatePicker value={templateId} onChange={setTemplateId} />
        </CardContent>
      </Card>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Alterações salvas.
        </p>
      ) : null}

      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
