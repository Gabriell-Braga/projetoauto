import { describe, expect, it } from "vitest";
import { normalizePanelUrl } from "./panel-url";

describe("normalizePanelUrl", () => {
  it("aceita o endereco completo sem mexer", () => {
    expect(normalizePanelUrl("https://crm.carbud.com.br")).toBe(
      "https://crm.carbud.com.br",
    );
  });

  /*
   * O erro que derrubou o primeiro deploy: sem esquema, o Next recusa o
   * `rewrites()` inteiro com "Invalid rewrite found" e nao diz qual variavel
   * causou. Custa uma publicacao para descobrir.
   */
  it("completa o esquema quando falta", () => {
    expect(normalizePanelUrl("crm.carbud.com.br")).toBe(
      "https://crm.carbud.com.br",
    );
  });

  it("tira a barra do fim, que dobraria com a do caminho", () => {
    expect(normalizePanelUrl("https://crm.carbud.com.br/")).toBe(
      "https://crm.carbud.com.br",
    );
    expect(normalizePanelUrl("crm.carbud.com.br///")).toBe(
      "https://crm.carbud.com.br",
    );
  });

  it("nao promove http para https: em desenvolvimento o painel e local", () => {
    expect(normalizePanelUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("ignora espaco em volta, que colar num campo costuma trazer", () => {
    expect(normalizePanelUrl("  https://crm.carbud.com.br  ")).toBe(
      "https://crm.carbud.com.br",
    );
  });

  it("reclama com o nome da variavel quando esta vazia", () => {
    expect(() => normalizePanelUrl(undefined)).toThrow(/PANEL_URL/);
    expect(() => normalizePanelUrl("   ")).toThrow(/PANEL_URL/);
  });

  it("reclama quando o valor nem parece endereco", () => {
    expect(() => normalizePanelUrl("https://")).toThrow(/PANEL_URL/);
  });
});
