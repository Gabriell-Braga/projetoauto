import { describe, expect, it } from "vitest";
import { parseFigmaUrl } from "./figma-fetch.mjs";

/**
 * A URL que a pessoa copia do navegador precisa virar dois valores certos.
 *
 * O `node-id` vem com hífen na barra de endereço ("1-60") e a API exige
 * dois-pontos ("1:60"). Mandar o hífen devolve 404 sem explicar nada, e o 404
 * parece problema de permissão — dá para perder uma tarde achando que o token
 * está errado quando o defeito é um caractere.
 */
describe("parseFigmaUrl", () => {
  const url =
    "https://www.figma.com/design/sYCzgGXerKoj1sWvhgg7ka/CRM-Ve%C3%ADculos-%E2%80%94-Template-01?node-id=1-60&t=PnwUQf8iBI9QX8sI-1";

  it("tira a chave do arquivo do meio da URL", () => {
    expect(parseFigmaUrl(url).fileKey).toBe("sYCzgGXerKoj1sWvhgg7ka");
  });

  it("converte o node-id de hífen para dois-pontos", () => {
    expect(parseFigmaUrl(url).nodeId).toBe("1:60");
  });

  it("troca só o primeiro hífen, que é o separador", () => {
    // "t=PnwUQf8iBI9QX8sI-1" vem depois e não pode contaminar o nó
    expect(parseFigmaUrl("https://figma.com/design/aaaaaaaaaaaaaaaaaaaaaa/x?node-id=12-345").nodeId).toBe(
      "12:345",
    );
  });

  it("aceita o formato antigo /file/", () => {
    expect(parseFigmaUrl("https://figma.com/file/aaaaaaaaaaaaaaaaaaaaaa/x").fileKey).toBe(
      "aaaaaaaaaaaaaaaaaaaaaa",
    );
  });

  it("devolve nó nulo quando a URL não aponta para um frame", () => {
    expect(parseFigmaUrl("https://figma.com/design/aaaaaaaaaaaaaaaaaaaaaa/x").nodeId).toBeNull();
  });

  it("recusa o que não é arquivo de design", () => {
    // /board/ é FigJam e /make/ é Figma Make — a API de arquivos não serve
    expect(() => parseFigmaUrl("https://figma.com/board/aaaaaaaaaaaaaaaaaaaaaa/x")).toThrow();
    expect(() => parseFigmaUrl("https://exemplo.com")).toThrow();
  });
});
