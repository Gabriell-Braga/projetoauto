"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, FormField, Input, Textarea } from "@/components/ui/field";
import { apiDelete, apiPatch, apiUpload } from "@/lib/client/api";
import { ACCEPTED_INPUT, blobFileName, resizeSingle } from "@/lib/client/images";
import { mediaUrl } from "@/lib/paths";

export type BannerItem = {
  id: string;
  imageKey: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  active: boolean;
};

export type ContentValues = {
  aboutTitle: string;
  aboutText: string;
  gtmCode: string;
  gtmInherited: boolean;
};

export function ContentPanel({
  initial,
  banners,
  readOnly,
}: {
  initial: ContentValues;
  banners: BannerItem[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ContentValues>(key: K, value: ContentValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await apiPatch("/api/admin/site", {
      aboutTitle: values.aboutTitle,
      aboutText: values.aboutText,
      ...(values.gtmCode ? { gtmCode: values.gtmCode } : { clearGtm: true }),
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function handleBannerUpload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const blob = await resizeSingle(file, 1920, 0.82);
      const formData = new FormData();
      formData.append("file", blob, blobFileName(blob, "banner"));
      const result = await apiUpload("/api/admin/site/banners", formData);
      if (!result.ok) setError(result.error);
      else router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload");
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function patchBanner(id: string, payload: Record<string, unknown>) {
    setBusy(true);
    const result = await apiPatch(`/api/admin/site/banners/${id}`, payload);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function deleteBanner(id: string) {
    if (!window.confirm("Remover este banner?")) return;
    setBusy(true);
    const result = await apiDelete(`/api/admin/site/banners/${id}`);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sobre a revenda</CardTitle>
          <CardDescription>
            Este texto aparece na home e na página de contato do seu site.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField label="Título" htmlFor="aboutTitle">
            <Input
              id="aboutTitle"
              value={values.aboutTitle}
              disabled={readOnly}
              onChange={(event) => update("aboutTitle", event.target.value)}
              placeholder="Sobre nós"
            />
          </FormField>
          <FormField label="Texto" htmlFor="aboutText" className="mb-0">
            <Textarea
              id="aboutText"
              rows={6}
              value={values.aboutText}
              disabled={readOnly}
              onChange={(event) => update("aboutText", event.target.value)}
              placeholder="Há 15 anos no mercado, trabalhamos com seminovos revisados e com garantia..."
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google Tag Manager</CardTitle>
          <CardDescription>
            {values.gtmInherited
              ? "Sem código próprio, o site usa o GTM configurado pela plataforma."
              : "Este código é injetado no <head> de todas as páginas do seu site."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            label="Código do contêiner"
            htmlFor="gtmCode"
            hint="Formato GTM-XXXXXXX. Deixe vazio para usar o código da plataforma."
            className="mb-0"
          >
            <Input
              id="gtmCode"
              value={values.gtmCode}
              disabled={readOnly}
              onChange={(event) => update("gtmCode", event.target.value.toUpperCase())}
              placeholder="GTM-ABC1234"
            />
          </FormField>
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

      {!readOnly ? (
        <Button type="button" disabled={busy} onClick={handleSave}>
          {busy ? "Salvando..." : "Salvar conteúdo"}
        </Button>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Banners da home</CardTitle>
          <CardDescription>
            O primeiro banner ativo vira o destaque principal da home.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_INPUT}
            className="hidden"
            disabled={readOnly || busy}
            onChange={(event) => handleBannerUpload(event.target.files?.[0])}
          />

          {!readOnly ? (
            <Button
              type="button"
              variant="secondary"
              className="mb-4"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Adicionar banner
            </Button>
          ) : null}

          {banners.length === 0 ? (
            <p className="rounded-lg border border-dashed border-ink-200 px-4 py-8 text-center text-sm text-ink-500">
              Nenhum banner cadastrado. Sem banner, a home usa um destaque padrão com o nome da
              revenda.
            </p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div key={banner.id} className="rounded-lg border border-ink-200 p-4">
                  <div className="mb-3 h-28 w-full overflow-hidden rounded bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={mediaUrl(banner.imageKey) ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <FormField label="Título" htmlFor={`banner-title-${banner.id}`}>
                      <Input
                        id={`banner-title-${banner.id}`}
                        defaultValue={banner.title ?? ""}
                        disabled={readOnly}
                        onBlur={(event) => patchBanner(banner.id, { title: event.target.value })}
                      />
                    </FormField>
                    <FormField label="Subtítulo" htmlFor={`banner-subtitle-${banner.id}`}>
                      <Input
                        id={`banner-subtitle-${banner.id}`}
                        defaultValue={banner.subtitle ?? ""}
                        disabled={readOnly}
                        onBlur={(event) => patchBanner(banner.id, { subtitle: event.target.value })}
                      />
                    </FormField>
                    <FormField label="Texto do botão" htmlFor={`banner-cta-${banner.id}`}>
                      <Input
                        id={`banner-cta-${banner.id}`}
                        defaultValue={banner.ctaLabel ?? ""}
                        disabled={readOnly}
                        onBlur={(event) => patchBanner(banner.id, { ctaLabel: event.target.value })}
                      />
                    </FormField>
                    <FormField label="Link do botão" htmlFor={`banner-href-${banner.id}`}>
                      <Input
                        id={`banner-href-${banner.id}`}
                        defaultValue={banner.ctaHref ?? ""}
                        disabled={readOnly}
                        onBlur={(event) => patchBanner(banner.id, { ctaHref: event.target.value })}
                      />
                    </FormField>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <Checkbox
                        checked={banner.active}
                        disabled={readOnly || busy}
                        onChange={(event) =>
                          patchBanner(banner.id, { active: event.target.checked })
                        }
                      />
                      Ativo
                    </label>
                    {!readOnly ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outlineDanger"
                        disabled={busy}
                        onClick={() => deleteBanner(banner.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
