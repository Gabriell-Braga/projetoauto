"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, Select } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiGet } from "@/lib/client/api";
import { formatCurrency } from "@/lib/utils";

type Brand = { codigo: string; nome: string };
type Model = { codigo: number; nome: string };
type Year = { codigo: string; nome: string };

export type FipeResult = {
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  valorCents: number;
};

/**
 * Consulta assistida à tabela FIPE.
 *
 * Preenche a ficha a partir do que a FIPE conhece, em vez de a pessoa digitar
 * marca e modelo de cabeça — é o que evita "Chevrolet Onix" e "GM Onix" no
 * mesmo estoque, que depois quebra qualquer filtro.
 *
 * Não trava nada: se a FIPE estiver fora do ar, o formulário continua
 * preenchível na mão. O carro é da revenda, não da tabela.
 */
export function FipeLookup({
  onApply,
  reference,
}: {
  onApply: (result: FipeResult) => void;
  reference: { code: string | null; priceCents: number | null; month: string | null };
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<Year[]>([]);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");

  const [loading, setLoading] = useState<null | "marcas" | "modelos" | "anos" | "preco">(null);
  const [result, setResult] = useState<FipeResult | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!open || brands.length > 0) return;

    setLoading("marcas");
    apiGet<{ marcas: Brand[] }>("/api/admin/fipe?etapa=marcas").then((response) => {
      setLoading(null);
      if (!response.ok) {
        setFailed(response.error);
        return;
      }
      setBrands(response.data.marcas);
    });
  }, [open, brands.length]);

  async function pickBrand(code: string) {
    setBrand(code);
    setModel("");
    setYear("");
    setModels([]);
    setYears([]);
    setResult(null);
    if (!code) return;

    setLoading("modelos");
    const response = await apiGet<{ modelos: Model[] }>(
      `/api/admin/fipe?etapa=modelos&marca=${encodeURIComponent(code)}`,
    );
    setLoading(null);
    if (!response.ok) {
      setFailed(response.error);
      return;
    }
    setModels(response.data.modelos);
  }

  async function pickModel(code: string) {
    setModel(code);
    setYear("");
    setYears([]);
    setResult(null);
    if (!code) return;

    setLoading("anos");
    const response = await apiGet<{ anos: Year[] }>(
      `/api/admin/fipe?etapa=anos&marca=${encodeURIComponent(brand)}&modelo=${encodeURIComponent(code)}`,
    );
    setLoading(null);
    if (!response.ok) {
      setFailed(response.error);
      return;
    }
    setYears(response.data.anos);
  }

  async function pickYear(code: string) {
    setYear(code);
    setResult(null);
    if (!code) return;

    setLoading("preco");
    const response = await apiGet<FipeResult>(
      `/api/admin/fipe?etapa=preco&marca=${encodeURIComponent(brand)}&modelo=${encodeURIComponent(model)}&ano=${encodeURIComponent(code)}`,
    );
    setLoading(null);
    if (!response.ok) {
      setFailed(response.error);
      return;
    }
    setFailed(null);
    setResult(response.data);
  }

  function apply() {
    if (!result) return;
    onApply(result);
    toast.success("Ficha preenchida pela FIPE", "Confira e ajuste o que for diferente.");
    setOpen(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Tabela FIPE</CardTitle>
          <CardDescription>
            {reference.code
              ? `Referência gravada: ${formatCurrency(reference.priceCents ?? 0)} · ${reference.month ?? ""} · código ${reference.code}`
              : "Preencha a ficha a partir da tabela e guarde o preço de referência."}
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => setOpen((current) => !current)}
        >
          <Search className="h-3.5 w-3.5" />
          {open ? "Fechar" : reference.code ? "Consultar de novo" : "Consultar FIPE"}
        </Button>
      </CardHeader>

      {open ? (
        <CardContent>
          {failed ? (
            <Alert tone="warning" className="mb-4">
              {failed} O cadastro segue normalmente sem a consulta.
            </Alert>
          ) : null}

          <div className="grid gap-x-4 sm:grid-cols-3">
            <FormField label="Marca" htmlFor="fipe-brand">
              <Select
                id="fipe-brand"
                value={brand}
                disabled={loading === "marcas"}
                onChange={(event) => void pickBrand(event.target.value)}
              >
                <option value="">
                  {loading === "marcas" ? "Carregando..." : "Escolha a marca"}
                </option>
                {brands.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Modelo" htmlFor="fipe-model">
              <Select
                id="fipe-model"
                value={model}
                disabled={!brand || loading === "modelos"}
                onChange={(event) => void pickModel(event.target.value)}
              >
                <option value="">
                  {loading === "modelos" ? "Carregando..." : "Escolha o modelo"}
                </option>
                {models.map((item) => (
                  <option key={item.codigo} value={String(item.codigo)}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Ano" htmlFor="fipe-year">
              <Select
                id="fipe-year"
                value={year}
                disabled={!model || loading === "anos"}
                onChange={(event) => void pickYear(event.target.value)}
              >
                <option value="">{loading === "anos" ? "Carregando..." : "Escolha o ano"}</option>
                {years.map((item) => (
                  <option key={item.codigo} value={item.codigo}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>

          {loading === "preco" ? (
            <p className="text-[13px] text-muted">Consultando o valor...</p>
          ) : null}

          {result ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-surface-2 p-3">
              <div className="text-[13px]">
                <p className="font-medium text-text">
                  {result.marca} {result.modelo}
                </p>
                <p className="text-muted">
                  {result.anoModelo} · {result.combustivel} · código {result.codigoFipe}
                </p>
                <p className="mt-1 tabular-nums text-text">
                  {formatCurrency(result.valorCents)}
                  <span className="ml-1.5 text-xs text-faint">
                    referência de {result.mesReferencia}
                  </span>
                </p>
              </div>
              <Button type="button" onClick={apply}>
                Usar estes dados
              </Button>
            </div>
          ) : null}
        </CardContent>
      ) : null}
    </Card>
  );
}
