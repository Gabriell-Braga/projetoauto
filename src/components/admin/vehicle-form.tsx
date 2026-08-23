"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, FormField, Input, Select, Textarea } from "@/components/ui/field";
import { BODY_TYPES, FUELS, TRANSMISSIONS, VEHICLE_STATUS } from "@/db/schema";
import {
  BODY_TYPE_LABELS,
  COLORS,
  FUEL_LABELS,
  TRANSMISSION_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/lib/catalog/labels";
import { OPTION_GROUPS, VEHICLE_OPTIONS } from "@/lib/catalog/options";
import { apiGet, apiPatch, apiPost } from "@/lib/client/api";

export type VehicleFormValues = {
  id?: string;
  brand: string;
  model: string;
  version: string;
  yearManufacture: number;
  yearModel: number;
  mileageKm: number;
  priceCents: number;
  priceOnRequest: boolean;
  transmission: string;
  fuel: string;
  bodyType: string;
  color: string;
  doors: string;
  licensePlateEnd: string;
  options: string[];
  description: string;
  status: string;
  featured: boolean;
};

type BrandCatalog = { brand: string; models: string[] }[];

const CURRENT_YEAR = new Date().getFullYear();

export function emptyVehicle(): VehicleFormValues {
  return {
    brand: "",
    model: "",
    version: "",
    yearManufacture: CURRENT_YEAR,
    yearModel: CURRENT_YEAR,
    mileageKm: 0,
    priceCents: 0,
    priceOnRequest: false,
    transmission: "",
    fuel: "",
    bodyType: "",
    color: "",
    doors: "",
    licensePlateEnd: "",
    options: [],
    description: "",
    status: "draft",
    featured: false,
  };
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function inputToCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  return Math.round((Number(normalized) || 0) * 100);
}

export function VehicleForm({
  initial,
  readOnly,
}: {
  initial: VehicleFormValues;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const isEditing = Boolean(initial.id);

  const [values, setValues] = useState<VehicleFormValues>(initial);
  const [priceText, setPriceText] = useState(centsToInput(initial.priceCents));
  const [catalog, setCatalog] = useState<BrandCatalog>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiGet<BrandCatalog>("/api/admin/catalog/brands").then((result) => {
      if (active && result.ok) setCatalog(result.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const models = useMemo(() => {
    const entry = catalog.find(
      (item) => item.brand.toLowerCase() === values.brand.trim().toLowerCase(),
    );
    return entry?.models ?? [];
  }, [catalog, values.brand]);

  function update<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function toggleOption(optionKey: string) {
    setValues((current) => ({
      ...current,
      options: current.options.includes(optionKey)
        ? current.options.filter((item) => item !== optionKey)
        : [...current.options, optionKey],
    }));
    setSaved(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    const payload = {
      brand: values.brand.trim(),
      model: values.model.trim(),
      version: values.version.trim(),
      yearManufacture: values.yearManufacture,
      yearModel: values.yearModel,
      mileageKm: values.mileageKm,
      priceCents: inputToCents(priceText),
      priceOnRequest: values.priceOnRequest,
      transmission: values.transmission,
      fuel: values.fuel,
      bodyType: values.bodyType,
      color: values.color,
      doors: values.doors,
      licensePlateEnd: values.licensePlateEnd,
      options: values.options,
      description: values.description,
      status: values.status,
      featured: values.featured,
    };

    const result = isEditing
      ? await apiPatch<{ id: string }>(`/api/admin/vehicles/${initial.id}`, payload)
      : await apiPost<{ id: string }>("/api/admin/vehicles", payload);

    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (isEditing) {
      setSaved(true);
      router.refresh();
      return;
    }

    router.push(`/admin/estoque/${result.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Marca" htmlFor="brand">
              <Input
                id="brand"
                list="brand-options"
                required
                disabled={readOnly}
                value={values.brand}
                onChange={(event) => update("brand", event.target.value)}
                placeholder="Chevrolet"
              />
              <datalist id="brand-options">
                {catalog.map((item) => (
                  <option key={item.brand} value={item.brand} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Modelo" htmlFor="model">
              <Input
                id="model"
                list="model-options"
                required
                disabled={readOnly}
                value={values.model}
                onChange={(event) => update("model", event.target.value)}
                placeholder="Onix"
              />
              <datalist id="model-options">
                {models.map((model) => (
                  <option key={model} value={model} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Versão" htmlFor="version">
              <Input
                id="version"
                disabled={readOnly}
                value={values.version}
                onChange={(event) => update("version", event.target.value)}
                placeholder="1.0 Turbo LTZ"
              />
            </FormField>

            <FormField label="Ano de fabricação" htmlFor="yearManufacture">
              <Input
                id="yearManufacture"
                type="number"
                required
                min={1950}
                max={CURRENT_YEAR + 2}
                disabled={readOnly}
                value={values.yearManufacture}
                onChange={(event) => update("yearManufacture", Number(event.target.value))}
              />
            </FormField>

            <FormField label="Ano do modelo" htmlFor="yearModel">
              <Input
                id="yearModel"
                type="number"
                required
                min={1950}
                max={CURRENT_YEAR + 2}
                disabled={readOnly}
                value={values.yearModel}
                onChange={(event) => update("yearModel", Number(event.target.value))}
              />
            </FormField>

            <FormField label="Quilometragem" htmlFor="mileageKm">
              <Input
                id="mileageKm"
                type="number"
                min={0}
                disabled={readOnly}
                value={values.mileageKm}
                onChange={(event) => update("mileageKm", Number(event.target.value))}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preço e publicação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Preço (R$)" htmlFor="price">
              <Input
                id="price"
                inputMode="decimal"
                disabled={readOnly || values.priceOnRequest}
                value={priceText}
                onChange={(event) => {
                  setPriceText(event.target.value);
                  setSaved(false);
                }}
              />
            </FormField>

            <FormField label="Situação do anúncio" htmlFor="status">
              <Select
                id="status"
                disabled={readOnly}
                value={values.status}
                onChange={(event) => update("status", event.target.value)}
              >
                {VEHICLE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {VEHICLE_STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className="flex flex-col justify-center gap-3 pb-4">
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox
                  disabled={readOnly}
                  checked={values.priceOnRequest}
                  onChange={(event) => update("priceOnRequest", event.target.checked)}
                />
                Preço sob consulta
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <Checkbox
                  disabled={readOnly}
                  checked={values.featured}
                  onChange={(event) => update("featured", event.target.checked)}
                />
                Destacar na home do site
              </label>
            </div>
          </div>
          <p className="text-xs text-ink-500">
            Somente anúncios <strong>disponíveis</strong> e <strong>reservados</strong> aparecem no
            site público. Rascunhos ficam visíveis apenas aqui.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ficha técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Câmbio" htmlFor="transmission">
              <Select
                id="transmission"
                disabled={readOnly}
                value={values.transmission}
                onChange={(event) => update("transmission", event.target.value)}
              >
                <option value="">Não informado</option>
                {TRANSMISSIONS.map((value) => (
                  <option key={value} value={value}>
                    {TRANSMISSION_LABELS[value]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Combustível" htmlFor="fuel">
              <Select
                id="fuel"
                disabled={readOnly}
                value={values.fuel}
                onChange={(event) => update("fuel", event.target.value)}
              >
                <option value="">Não informado</option>
                {FUELS.map((value) => (
                  <option key={value} value={value}>
                    {FUEL_LABELS[value]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Carroceria" htmlFor="bodyType">
              <Select
                id="bodyType"
                disabled={readOnly}
                value={values.bodyType}
                onChange={(event) => update("bodyType", event.target.value)}
              >
                <option value="">Não informado</option>
                {BODY_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {BODY_TYPE_LABELS[value]}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Cor" htmlFor="color">
              <Input
                id="color"
                list="color-options"
                disabled={readOnly}
                value={values.color}
                onChange={(event) => update("color", event.target.value)}
              />
              <datalist id="color-options">
                {COLORS.map((color) => (
                  <option key={color} value={color} />
                ))}
              </datalist>
            </FormField>

            <FormField label="Portas" htmlFor="doors">
              <Select
                id="doors"
                disabled={readOnly}
                value={values.doors}
                onChange={(event) => update("doors", event.target.value)}
              >
                <option value="">Não informado</option>
                {[2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} portas
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField
              label="Final da placa"
              htmlFor="licensePlateEnd"
              hint="Apenas o último dígito"
            >
              <Input
                id="licensePlateEnd"
                maxLength={1}
                disabled={readOnly}
                value={values.licensePlateEnd}
                onChange={(event) =>
                  update("licensePlateEnd", event.target.value.replace(/\D/g, ""))
                }
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opcionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {OPTION_GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {group}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {VEHICLE_OPTIONS.filter((option) => option.group === group).map((option) => (
                    <label
                      key={option.key}
                      className="flex items-center gap-2 text-sm text-ink-700"
                    >
                      <Checkbox
                        disabled={readOnly}
                        checked={values.options.includes(option.key)}
                        onChange={() => toggleOption(option.key)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField label="Texto do anúncio" htmlFor="description" className="mb-0">
            <Textarea
              id="description"
              rows={6}
              disabled={readOnly}
              value={values.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Único dono, revisões em concessionária, pneus novos..."
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
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/estoque")}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </form>
  );
}
