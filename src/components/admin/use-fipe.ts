"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/client/api";

type Brand = { codigo: string; nome: string };
type Model = { codigo: number; nome: string };
type Year = { codigo: string; nome: string };

export type FipeQuote = {
  marca: string;
  modelo: string;
  anoModelo: number;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
  valorCents: number;
};

/** Marcas de acento, removidas antes de comparar. */
const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");

/** Compara ignorando caixa e acento: a pessoa digita "Citroen", a FIPE tem "Citroën". */
function same(a: string, b: string): boolean {
  const clean = (value: string) =>
    value.normalize("NFD").replace(ACCENTS, "").trim().toLowerCase();
  return clean(a) === clean(b);
}

/**
 * Catálogo da FIPE acompanhando os campos do formulário.
 *
 * Em vez de um card separado perguntando marca e modelo de novo, a marca
 * digitada resolve o código na tabela e traz os modelos; o modelo traz os anos.
 * Perguntar duas vezes a mesma coisa é o que faz a pessoa ignorar a ferramenta
 * e digitar tudo na mão.
 *
 * Falha em silêncio de propósito: FIPE fora do ar deixa as listas vazias e o
 * cadastro segue normal. O carro é da revenda, não da tabela.
 */
export function useFipe(brand: string, model: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const brandCode = brands.find((item) => same(item.nome, brand))?.codigo ?? null;
  const modelCode = models.find((item) => same(item.nome, model))?.codigo ?? null;

  useEffect(() => {
    let active = true;
    apiGet<{ marcas: Brand[] }>("/api/admin/fipe?etapa=marcas").then((result) => {
      if (active && result.ok) setBrands(result.data.marcas);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!brandCode) {
      setModels([]);
      return;
    }
    let active = true;
    apiGet<{ modelos: Model[] }>(
      `/api/admin/fipe?etapa=modelos&marca=${encodeURIComponent(brandCode)}`,
    ).then((result) => {
      if (active && result.ok) setModels(result.data.modelos);
    });
    return () => {
      active = false;
    };
  }, [brandCode]);

  useEffect(() => {
    if (!brandCode || !modelCode) {
      setYears([]);
      return;
    }
    let active = true;
    setLoadingYears(true);
    apiGet<{ anos: Year[] }>(
      `/api/admin/fipe?etapa=anos&marca=${encodeURIComponent(brandCode)}&modelo=${modelCode}`,
    ).then((result) => {
      if (!active) return;
      setLoadingYears(false);
      if (result.ok) setYears(result.data.anos);
    });
    return () => {
      active = false;
    };
  }, [brandCode, modelCode]);

  const fetchQuote = useCallback(
    async (yearCode: string): Promise<FipeQuote | null> => {
      if (!brandCode || !modelCode) return null;
      const result = await apiGet<FipeQuote>(
        `/api/admin/fipe?etapa=preco&marca=${encodeURIComponent(brandCode)}&modelo=${modelCode}&ano=${encodeURIComponent(yearCode)}`,
      );
      return result.ok ? result.data : null;
    },
    [brandCode, modelCode],
  );

  return {
    brands: brands.map((item) => item.nome),
    models: models.map((item) => item.nome),
    years,
    loadingYears,
    /** A marca digitada existe na tabela? Sem isso não há o que consultar. */
    brandRecognized: Boolean(brandCode),
    modelRecognized: Boolean(modelCode),
    fetchQuote,
  };
}
