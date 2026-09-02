"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBrands,
  fetchModels,
  fetchQuote,
  fetchYears,
  type FipeBrand,
  type FipeModel,
  type FipeQuote,
  type FipeYear,
} from "@/lib/client/fipe-client";
import { joinFipeModel, splitFipeModel } from "@/lib/integrations/fipe";

type Brand = FipeBrand;
type Model = FipeModel;
type Year = FipeYear;

export type { FipeQuote };

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
 * A consulta sai do NAVEGADOR, não do servidor: a API limita por IP, e o IP de
 * saída do Cloudflare Workers é compartilhado e já vinha estourado. Cada
 * revenda usando o próprio IP resolve o problema por inteiro.
 *
 * Falha sem travar: FIPE fora do ar deixa as listas vazias, o aviso aparece e o
 * cadastro segue na mão. O carro é da revenda, não da tabela.
 */
export function useFipe(brand: string, model: string, version: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [failure, setFailure] = useState<string | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const brandCode = brands.find((item) => same(item.nome, brand))?.codigo ?? null;
  // a FIPE conhece o nome inteiro; aqui ele está partido em dois campos
  const fullModel = joinFipeModel(model, version);
  const modelCode = models.find((item) => same(item.nome, fullModel))?.codigo ?? null;

  useEffect(() => {
    let active = true;
    fetchBrands()
      .then((list) => {
        if (!active) return;
        setBrands(list);
        setFailure(null);
      })
      // o motivo importa: cota esgotada tem conserto diferente de fora do ar
      .catch((error: Error) => active && setFailure(error.message))
      .finally(() => active && setLoadingBrands(false));
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
    setLoadingModels(true);
    fetchModels(brandCode)
      .then((list) => {
        if (!active) return;
        setModels(list);
        setFailure(null);
      })
      .catch((error: Error) => active && setFailure(error.message))
      .finally(() => active && setLoadingModels(false));
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
    fetchYears(brandCode, String(modelCode))
      .then((list) => {
        if (!active) return;
        setYears(list);
        setFailure(null);
      })
      .catch((error: Error) => active && setFailure(error.message))
      .finally(() => active && setLoadingYears(false));
    return () => {
      active = false;
    };
  }, [brandCode, modelCode]);

  const quoteFor = useCallback(
    async (yearCode: string): Promise<FipeQuote | null> => {
      if (!brandCode || !modelCode) return null;
      try {
        const quote = await fetchQuote(brandCode, String(modelCode), yearCode);
        setFailure(null);
        return quote;
      } catch (error) {
        setFailure((error as Error).message);
        return null;
      }
    },
    [brandCode, modelCode],
  );

  const split = models.map((item) => splitFipeModel(item.nome));

  return {
    brands: brands.map((item) => item.nome),
    /** Primeira palavra de cada nome, sem repetir: é o modelo que o filtro usa. */
    models: [...new Set(split.map((item) => item.model))].sort((a, b) => a.localeCompare(b)),
    /** Versões daquele modelo, já sem o nome do modelo na frente. */
    versions: split
      .filter((item) => same(item.model, model) && item.version)
      .map((item) => item.version)
      .sort((a, b) => a.localeCompare(b)),
    years,
    /** Mensagem da FIPE quando ela recusa; nula quando está tudo bem. */
    failure,
    loadingBrands,
    loadingModels,
    loadingYears,
    /** A marca digitada existe na tabela? Sem isso não há o que consultar. */
    brandRecognized: Boolean(brandCode),
    modelRecognized: Boolean(modelCode),
    fetchQuote: quoteFor,
  };
}
