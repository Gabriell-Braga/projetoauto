"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { PhotoManager, type PhotoItem } from "@/components/admin/photo-manager";
import { useFipe, type FipeQuote } from "@/components/admin/use-fipe";
import { priceGapPercent, priceVerdict } from "@/lib/integrations/fipe";
import { apiDelete, apiPatch, apiPost } from "@/lib/client/api";
import type { VehicleFormValues } from "./vehicle-form-types";


const CURRENT_YEAR = new Date().getFullYear();

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
  photos = [],
}: {
  initial: VehicleFormValues;
  readOnly?: boolean;
  photos?: PhotoItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const isEditing = Boolean(initial.id);

  const [values, setValues] = useState<VehicleFormValues>(initial);
  const [priceText, setPriceText] = useState(centsToInput(initial.priceCents));
  const [fipeYear, setFipeYear] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * Rascunho aberto para receber as fotos antes de a ficha existir.
   *
   * Enquanto ele estiver aqui e a ficha não tiver sido salva, existe trabalho
   * que se perde ao sair da tela — daí o aviso de saída e o botão de descartar.
   */
  const [draftId, setDraftId] = useState<string | null>(null);
  const [photoCount, setPhotoCount] = useState(photos.length);
  const [discarding, setDiscarding] = useState(false);

  const hasUnsavedPhotos = !isEditing && draftId !== null && photoCount > 0;

  // sair com fotos enviadas e ficha não salva perde as fotos
  useEffect(() => {
    if (!hasUnsavedPhotos) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedPhotos]);

  /** Abre o rascunho no primeiro envio de foto. */
  async function ensureDraft(): Promise<string | null> {
    if (draftId) return draftId;
    const result = await apiPost<{ id: string }>("/api/admin/vehicles/draft");
    if (!result.ok) {
      toast.error("Não consegui preparar o envio das fotos", result.error);
      return null;
    }
    setDraftId(result.data.id);
    return result.data.id;
  }

  async function handleDiscard() {
    const confirmed = await confirm({
      title: "Descartar cadastro",
      description: `Você sai sem salvar e ${photoCount === 1 ? "a foto enviada é apagada" : `as ${photoCount} fotos enviadas são apagadas`}.`,
      confirmLabel: "Descartar",
      cancelLabel: "Continuar cadastrando",
      tone: "danger",
    });
    if (!confirmed || !draftId) return;

    setDiscarding(true);
    await apiDelete(`/api/admin/vehicles/${draftId}`);
    setDraftId(null);
    setPhotoCount(0);
    setDiscarding(false);
    router.push("/admin/estoque");
  }


  /**
   * A FIPE agora alimenta os próprios campos de marca e modelo.
   *
   * Antes havia um card separado perguntando as duas coisas de novo, e só
   * depois o formulário — a mesma pergunta duas vezes na mesma tela.
   */
  const fipe = useFipe(values.brand, values.model);

  function update<K extends keyof VehicleFormValues>(key: K, value: VehicleFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  /**
   * Traz a FIPE para a ficha sem apagar o que a pessoa já preencheu.
   *
   * Marca, modelo e ano vêm da tabela porque é o que padroniza o estoque. O
   * preço NÃO é copiado: a FIPE é referência, e o valor de venda é decisão da
   * revenda — sobrescrever aqui apagaria uma escolha comercial.
   */
  /**
   * Compara o preço pedido com a referência gravada.
   *
   * Fica ao lado do campo, não num painel separado: a comparação só ajuda no
   * instante em que a pessoa decide o número. Depois de salvo, ninguém volta
   * para conferir.
   */
  const fipeHint = useMemo(() => {
    if (!values.fipePriceCents) return undefined;

    const gap = priceGapPercent(inputToCents(priceText), values.fipePriceCents);
    const verdict = priceVerdict(gap);
    if (gap === null || verdict === null) {
      return `FIPE ${centsToInput(values.fipePriceCents)}`;
    }

    const distance = `${Math.abs(gap).toFixed(1).replace(".", ",")}%`;
    if (verdict === "na_faixa") return `Na faixa da FIPE (${distance} de diferença)`;
    return verdict === "acima"
      ? `${distance} acima da FIPE`
      : `${distance} abaixo da FIPE`;
  }, [priceText, values.fipePriceCents]);

  async function pickFipeYear(yearCode: string) {
    setFipeYear(yearCode);
    if (!yearCode) return;

    setLoadingQuote(true);
    const quote = await fipe.fetchQuote(yearCode);
    setLoadingQuote(false);

    if (!quote) {
      toast.error("Não consegui consultar a FIPE", "Preencha o preço na mão e siga.");
      return;
    }
    applyFipe(quote);
    toast.success(
      "Referência da FIPE gravada",
      `${quote.marca} ${quote.modelo}, ${quote.mesReferencia}.`,
    );
  }

  function applyFipe(result: FipeQuote) {
    setValues((current) => ({
      ...current,
      yearModel: result.anoModelo,
      yearManufacture: current.yearManufacture || result.anoModelo,
      fipeCode: result.codigoFipe,
      fipePriceCents: result.valorCents,
      fipeReference: result.mesReferencia,
    }));
  }

  function toggleOption(optionKey: string) {
    setValues((current) => ({
      ...current,
      options: current.options.includes(optionKey)
        ? current.options.filter((item) => item !== optionKey)
        : [...current.options, optionKey],
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (readOnly) return;

    setSaving(true);

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
      fipeCode: values.fipeCode,
      fipePriceCents: values.fipePriceCents,
      fipeReference: values.fipeReference,
    };

    // o rascunho já existe e já tem as fotos: completar ele, não criar outro
    const target = isEditing ? initial.id : draftId;
    const result = target
      ? await apiPatch<{ id: string }>(`/api/admin/vehicles/${target}`, payload)
      : await apiPost<{ id: string }>("/api/admin/vehicles", payload);

    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (isEditing) {
      toast.success("Veículo atualizado.");
      router.refresh();
      return;
    }

    // salvo: as fotos deixaram de ser provisórias, o aviso de saída sai de cena
    setDraftId(null);
    toast.success(
      photoCount > 0
        ? "Veículo cadastrado com as fotos."
        : "Veículo cadastrado. Você pode adicionar fotos a qualquer momento.",
    );
    router.push(`/admin/estoque/${target ?? result.data.id}`);
    router.refresh();
  }

  const optionCount = values.options.length;
  const hasDescription = values.description.trim().length > 0;

  /**
   * Cor fora do catálogo continua na lista.
   *
   * Sem isso, abrir um veículo antigo com a cor digitada à mão apagaria o
   * valor ao salvar, e a pessoa nem veria acontecer.
   */
  const colorOptions =
    values.color && !COLORS.includes(values.color) ? [values.color, ...COLORS] : COLORS;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Accordion title="Identificação" summary="Marca, modelo e ano">
        <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            label="Marca"
            htmlFor="brand"
            hint={
              fipe.brandRecognized
                ? "Reconhecida na tabela FIPE"
                : "Escolha da lista para o preço de referência aparecer"
            }
          >
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
              {fipe.brands.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </FormField>

          <FormField
            label="Modelo"
            htmlFor="model"
            hint={
              !fipe.brandRecognized
                ? "Escolha a marca primeiro"
                : fipe.modelRecognized
                  ? "Reconhecido na tabela FIPE"
                  : "Escolha da lista para trazer os anos"
            }
          >
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
              {fipe.models.map((item) => (
                <option key={item} value={item} />
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

          {/*
            Aparece só quando há o que consultar. Escolher aqui preenche os anos
            e grava o preço de referência — é o que antes exigia repetir marca e
            modelo num card à parte.
          */}
          {!readOnly && fipe.years.length > 0 ? (
            <FormField
              label="Ano na tabela FIPE"
              htmlFor="fipe-year"
              hint={
                values.fipePriceCents
                  ? `Referência: ${(values.fipePriceCents / 100).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })} · ${values.fipeReference ?? ""}`
                  : "Preenche os anos e traz o preço de referência"
              }
            >
              <Select
                id="fipe-year"
                value={fipeYear}
                disabled={loadingQuote}
                onChange={(event) => void pickFipeYear(event.target.value)}
              >
                <option value="">
                  {loadingQuote ? "Consultando..." : "Escolha o ano"}
                </option>
                {fipe.years.map((year) => (
                  <option key={year.codigo} value={year.codigo}>
                    {year.nome}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}

          <FormField label="Quilometragem" htmlFor="mileageKm" hint="Em km rodados">
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
      </Accordion>

      <Accordion title="Ficha técnica" summary="Câmbio, combustível e cor">
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

          {/*
            Cor virou lista fechada. Digitada à mão, o mesmo tom vira "Prata",
            "prata" e "Cinza prata" no estoque, e o filtro do site passa a
            mostrar três cores onde existe uma.
          */}
          <FormField label="Cor" htmlFor="color">
            <Select
              id="color"
              disabled={readOnly}
              value={values.color}
              onChange={(event) => update("color", event.target.value)}
            >
              <option value="">Não informada</option>
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </Select>
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

          <FormField label="Final da placa" htmlFor="licensePlateEnd" hint="Apenas o último dígito">
            <Input
              id="licensePlateEnd"
              maxLength={1}
              inputMode="numeric"
              disabled={readOnly}
              value={values.licensePlateEnd}
              onChange={(event) => update("licensePlateEnd", event.target.value.replace(/\D/g, ""))}
            />
          </FormField>
        </div>
      </Accordion>

      <Accordion title="Preço e publicação" summary="Valor e onde o anúncio aparece">
        <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Preço (R$)" htmlFor="price" hint={fipeHint}>
            <Input
              id="price"
              inputMode="decimal"
              disabled={readOnly || values.priceOnRequest}
              value={priceText}
              onChange={(event) => setPriceText(event.target.value)}
            />
          </FormField>

          <FormField
            label="Situação do anúncio"
            htmlFor="status"
            hint="Rascunho fica só aqui dentro"
          >
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

          <div className="mb-4 flex flex-col justify-center gap-2.5">
            <label className="flex items-center gap-2 text-[13px] text-text">
              <Checkbox
                disabled={readOnly}
                checked={values.priceOnRequest}
                onChange={(event) => update("priceOnRequest", event.target.checked)}
              />
              Preço sob consulta
            </label>
            <label className="flex items-center gap-2 text-[13px] text-text">
              <Checkbox
                disabled={readOnly}
                checked={values.featured}
                onChange={(event) => update("featured", event.target.checked)}
              />
              Destacar na home do site
            </label>
          </div>
        </div>

        <p className="text-xs text-muted">
          Somente anúncios <strong>disponíveis</strong> e <strong>reservados</strong> aparecem no
          site público.
        </p>
      </Accordion>

      {/*
        Sessenta caixas de seleção dominavam a página. Fechada por padrão, com a
        contagem no cabeçalho para ninguém esquecer que a seção existe.
      */}
      <Accordion
        title="Opcionais"
        defaultOpen={optionCount > 0}
        summary={optionCount === 0 ? "nenhum marcado" : optionCount + " marcados"}
        badge={optionCount > 0 ? <Badge tone="info">{optionCount}</Badge> : null}
      >
        <div className="space-y-5">
          {OPTION_GROUPS.map((group) => (
            <div key={group}>
              <p className="label-instrument mb-2 text-faint">{group}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {VEHICLE_OPTIONS.filter((option) => option.group === group).map((option) => (
                  <label key={option.key} className="flex items-center gap-2 text-[13px] text-text">
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
      </Accordion>

      <Accordion
        title="Descrição"
        defaultOpen={hasDescription}
        summary={hasDescription ? "preenchida" : "vazia"}
      >
        <FormField
          label="Texto do anúncio"
          htmlFor="description"
          hint="Aparece na página do veículo e conta para a busca do Google"
          className="mb-0"
        >
          <Textarea
            id="description"
            rows={6}
            disabled={readOnly}
            value={values.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Único dono, revisões em concessionária, pneus novos..."
          />
        </FormField>
      </Accordion>

      <PhotoManager
        vehicleId={isEditing ? initial.id : draftId ?? undefined}
        photos={photos}
        disabled={readOnly}
        resolveVehicleId={isEditing ? undefined : ensureDraft}
        onPhotosChange={setPhotoCount}
      />

      {!readOnly ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" loading={saving}>
            {isEditing ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
          {hasUnsavedPhotos ? (
            <Button
              type="button"
              variant="outlineDanger"
              loading={discarding}
              onClick={handleDiscard}
            >
              Descartar cadastro
            </Button>
          ) : (
            <Button type="button" variant="ghost" onClick={() => router.push("/admin/estoque")}>
              Cancelar
            </Button>
          )}
          {hasUnsavedPhotos ? (
            <p className="text-xs text-warning">
              {photoCount === 1 ? "1 foto enviada" : photoCount + " fotos enviadas"}. Salve o
              veículo para não perdê-las.
            </p>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
