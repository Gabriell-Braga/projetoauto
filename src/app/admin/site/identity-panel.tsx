"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { TemplatePicker } from "@/components/admin/template-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/field";
import { apiDelete, apiPatch, apiUpload } from "@/lib/client/api";
import { ACCEPTED_INPUT, blobFileName, resizeSingle } from "@/lib/client/images";
import { mediaUrl } from "@/lib/paths";

export type IdentityValues = {
  templateId: string;
  logoKey: string | null;
  theme: {
    primary: string;
    primaryForeground: string;
    accent: string;
    surface: string;
    fontHeading: string;
    fontBody: string;
  };
};

const FONT_OPTIONS = [
  { value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif", label: "Padrão do sistema" },
  { value: "Georgia, 'Times New Roman', serif", label: "Serifada clássica" },
  { value: "'Trebuchet MS', 'Segoe UI', sans-serif", label: "Trebuchet" },
  { value: "'Courier New', monospace", label: "Monoespaçada" },
  { value: "Impact, 'Arial Black', sans-serif", label: "Impacto (títulos)" },
];

export function IdentityPanel({
  initial,
  readOnly,
}: {
  initial: IdentityValues;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [templateId, setTemplateId] = useState(initial.templateId);
  const [theme, setTheme] = useState(initial.theme);
  const [logoKey, setLogoKey] = useState(initial.logoKey);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTheme(key: keyof IdentityValues["theme"], value: string) {
    setTheme((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function handleLogo(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      const blob = await resizeSingle(file, 480);
      const formData = new FormData();
      formData.append("file", blob, blobFileName(blob, "logo"));
      const result = await apiUpload<{ key: string }>("/api/admin/site/logo", formData);
      if (!result.ok) {
        setError(result.error);
      } else {
        setLogoKey(result.data.key);
        router.refresh();
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload");
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemoveLogo() {
    setBusy(true);
    const result = await apiDelete("/api/admin/site/logo");
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLogoKey(null);
    router.refresh();
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    setSaved(false);

    const result = await apiPatch("/api/admin/site", { templateId, theme });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const logoUrl = mediaUrl(logoKey);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>
            Use PNG com fundo transparente. A imagem é reduzida no seu navegador antes do envio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-40 items-center justify-center rounded-lg border border-ink-200 bg-ink-50">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="max-h-16 max-w-36 object-contain" />
              ) : (
                <span className="text-xs text-ink-400">Sem logo</span>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_INPUT}
              className="hidden"
              disabled={readOnly || busy}
              onChange={(event) => handleLogo(event.target.files?.[0])}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={readOnly || busy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Enviar logo
              </Button>
              {logoKey ? (
                <Button
                  type="button"
                  variant="outlineDanger"
                  disabled={readOnly || busy}
                  onClick={handleRemoveLogo}
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cores e fontes</CardTitle>
          <CardDescription>
            As cores viram variáveis CSS no template — nada fica fixo no código.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["primary", "Cor principal"],
                ["primaryForeground", "Texto sobre a cor principal"],
                ["accent", "Cor de apoio"],
                ["surface", "Fundo dos blocos"],
              ] as const
            ).map(([key, label]) => (
              <FormField key={key} label={label} htmlFor={`theme-${key}`}>
                <div className="flex gap-2">
                  <input
                    type="color"
                    aria-label={label}
                    value={theme[key]}
                    disabled={readOnly}
                    onChange={(event) => updateTheme(key, event.target.value)}
                    className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
                  />
                  <Input
                    id={`theme-${key}`}
                    value={theme[key]}
                    disabled={readOnly}
                    onChange={(event) => updateTheme(key, event.target.value)}
                  />
                </div>
              </FormField>
            ))}
          </div>

          <div className="grid gap-x-4 sm:grid-cols-2">
            <FormField label="Fonte dos títulos" htmlFor="fontHeading">
              <Select
                id="fontHeading"
                value={theme.fontHeading}
                disabled={readOnly}
                onChange={(event) => updateTheme("fontHeading", event.target.value)}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Fonte dos textos" htmlFor="fontBody">
              <Select
                id="fontBody"
                value={theme.fontBody}
                disabled={readOnly}
                onChange={(event) => updateTheme("fontBody", event.target.value)}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          <div
            className="rounded-lg border border-ink-200 p-4"
            style={{ backgroundColor: theme.surface }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: theme.primary, fontFamily: theme.fontHeading }}
            >
              Prévia do título
            </p>
            <p className="mt-1 text-xs text-ink-500" style={{ fontFamily: theme.fontBody }}>
              Assim ficam os textos do seu site.
            </p>
            <span
              className="mt-3 inline-block rounded-lg px-4 py-2 text-xs font-medium"
              style={{ backgroundColor: theme.primary, color: theme.primaryForeground }}
            >
              Botão de ação
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Template do site</CardTitle>
          <CardDescription>
            Trocar o template muda só a aparência. Estoque, fotos e leads continuam intactos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplatePicker
            value={templateId}
            disabled={readOnly}
            onChange={(value) => {
              setTemplateId(value);
              setSaved(false);
            }}
          />
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
          {busy ? "Salvando..." : "Salvar identidade"}
        </Button>
      ) : null}
    </div>
  );
}
