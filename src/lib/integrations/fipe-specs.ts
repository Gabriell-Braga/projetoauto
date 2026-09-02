/**
 * Ficha técnica deduzida do que a FIPE já entrega.
 *
 * A FIPE não tem campos separados para câmbio, carroceria e portas, mas o nome
 * do modelo é bem regular: "ONIX HATCH LT 1.0 12V Flex 5p Mec." carrega os
 * três. Ler isso poupa a revenda de preencher à mão o que já está na tela.
 *
 * Tudo aqui é palpite fundamentado, então vale uma regra: o resultado só
 * preenche campo VAZIO. Sobrescrever a escolha de quem cadastrou seria trocar
 * uma informação certa por uma provável.
 */

import type { BodyType, Fuel, Transmission } from "@/db/schema";

export type InferredSpecs = {
  transmission?: Transmission;
  fuel?: Fuel;
  bodyType?: BodyType;
  doors?: number;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase();
}

/**
 * Combustível vem do campo próprio da consulta, não do nome.
 *
 * É o único dos quatro que a FIPE devolve estruturado, então é o único que não
 * depende de leitura de texto.
 */
export function inferFuel(combustivel: string): Fuel | undefined {
  const value = normalize(combustivel);
  if (value.includes("flex")) return "flex";
  if (value.includes("diesel")) return "diesel";
  if (value.includes("alcool") || value.includes("etanol")) return "etanol";
  if (value.includes("eletrico")) return "eletrico";
  if (value.includes("hibrid")) return "hibrido";
  if (value.includes("gas") && !value.includes("gasolina")) return "gnv";
  if (value.includes("gasolina")) return "gasolina";
  return undefined;
}

/**
 * Câmbio pela abreviação no fim do nome.
 *
 * A ordem importa: "Aut." aparece em nomes que também trazem "Mec." como parte
 * de outra palavra, e os câmbios automatizados têm nome de marca — Dualogic,
 * Powershift, DSG — que não contêm "automático" em lugar nenhum.
 */
export function inferTransmission(modelName: string): Transmission | undefined {
  const value = normalize(modelName);

  if (value.includes("cvt")) return "cvt";
  if (
    /\b(dualogic|powershift|dsg|s-tronic|stronic|i-motion|imotion|easy-r|easyr|automatizad|autom\.?izada)\b/.test(
      value,
    )
  ) {
    return "automatizado";
  }
  if (/\b(aut\.?|automatico|tiptronic|multitronic|steptronic|geartronic|pdk)\b/.test(value)) {
    return "automatico";
  }
  if (/\b(mec\.?|manual)\b/.test(value)) return "manual";
  return undefined;
}

/** Carroceria pela palavra que a FIPE usa no nome. */
export function inferBodyType(modelName: string): BodyType | undefined {
  const value = normalize(modelName);

  if (/\b(hatch|hb)\b/.test(value)) return "hatch";
  if (/\bsedan?\b/.test(value)) return "sedan";
  if (/\b(pick-?up|cd|cs|cab\.?\s?dupla|cabine)\b/.test(value)) return "picape";
  if (/\b(cabrio|conversivel|roadster)\b/.test(value)) return "conversivel";
  if (/\b(coupe|cupe)\b/.test(value)) return "cupe";
  // a palavra que descreve a carroceria vem antes do nome do modelo:
  // "Kombi Furgão" é utilitário, e "Kombi" sozinha é minivan
  if (/\b(furgao|furgoneta|utilitario|chassi)\b/.test(value)) return "utilitario";
  if (/\b(minivan|van|kombi)\b/.test(value)) return "minivan";
  if (/\b(suv|4x4|awd)\b/.test(value)) return "suv";
  return undefined;
}

/**
 * Portas pelo "5p" ou "4p" que a FIPE escreve no fim.
 *
 * Limitado a 2–5 de propósito: número fora disso é leitura equivocada de outro
 * trecho do nome, e é melhor não responder do que responder errado.
 */
export function inferDoors(modelName: string): number | undefined {
  const match = normalize(modelName).match(/\b(\d)\s?p\b/);
  if (!match) return undefined;

  const doors = Number(match[1]);
  return doors >= 2 && doors <= 5 ? doors : undefined;
}

export function inferSpecs(modelName: string, combustivel: string): InferredSpecs {
  return {
    transmission: inferTransmission(modelName),
    fuel: inferFuel(combustivel),
    bodyType: inferBodyType(modelName),
    doors: inferDoors(modelName),
  };
}
