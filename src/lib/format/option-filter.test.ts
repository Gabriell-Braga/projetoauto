import { describe, expect, it } from "vitest";
import { filterOptions, fold } from "./option-filter";

const BRANDS = [
  { label: "Citroën", value: "citroen" },
  { label: "Chevrolet", value: "chevrolet" },
  { label: "Peugeot", value: "peugeot" },
  { label: "VW - VolksWagen", value: "vw" },
  { label: "Škoda", value: "skoda" },
];

describe("fold", () => {
  it("tira acento e caixa", () => {
    expect(fold("Citroën")).toBe("citroen");
    expect(fold("ÁÉÍÓÚÃÕÇ")).toBe("aeiouaoc");
  });

  it("não come letras sem acento", () => {
    expect(fold("Gol 1.0")).toBe("gol 1.0");
  });
});

describe("filterOptions", () => {
  it("devolve tudo quando não há busca", () => {
    expect(filterOptions(BRANDS, "")).toHaveLength(BRANDS.length);
    expect(filterOptions(BRANDS, "   ")).toHaveLength(BRANDS.length);
  });

  it("acha a marca acentuada digitando sem acento", () => {
    // é o caso que motivou o filtro: ninguém digita o trema da Citroën
    expect(filterOptions(BRANDS, "citroen").map((brand) => brand.value)).toEqual(["citroen"]);
    expect(filterOptions(BRANDS, "skoda").map((brand) => brand.value)).toEqual(["skoda"]);
  });

  it("ignora a caixa", () => {
    expect(filterOptions(BRANDS, "PEUGEOT").map((brand) => brand.value)).toEqual(["peugeot"]);
  });

  it("acha por trecho no meio do nome", () => {
    // a FIPE escreve "VW - VolksWagen"; quem digita procura "volks"
    expect(filterOptions(BRANDS, "volks").map((brand) => brand.value)).toEqual(["vw"]);
  });

  it("devolve todos os que combinam, não só o primeiro", () => {
    // Citroën e Chevrolet
    expect(filterOptions(BRANDS, "c").map((brand) => brand.value)).toEqual([
      "citroen",
      "chevrolet",
    ]);
  });

  it("devolve vazio quando nada combina", () => {
    expect(filterOptions(BRANDS, "ferrari")).toEqual([]);
  });

  it("não perde a opção vazia quando ela combina com a busca", () => {
    // a opção de rótulo "Não informado" tem valor vazio e continua escolhível
    const options = [{ label: "Não informado", value: "" }, { label: "Preto", value: "preto" }];
    expect(filterOptions(options, "nao")).toEqual([{ label: "Não informado", value: "" }]);
  });
});
