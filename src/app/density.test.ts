import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * O painel roda numa escala menor que o site público da revenda.
 *
 * A diferença mora em dois lugares que não se enxergam juntos: as classes dos
 * componentes (`text-sm`, `h-10`, `px-5`) e o `font-size` herdado por todo
 * texto que não tem classe própria. O segundo vem do `data-density="compact"`
 * no topo do shell. Sem ele, metade da tela volta para 16px e a outra metade
 * fica em 14px — e o resultado não parece um erro, parece só desalinhado.
 *
 * O site público não pode entrar nessa escala: ele é peça de marca, é o que o
 * cliente da revenda vê, e o C4MP pede 16px de corpo lá.
 */
function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("escala de densidade", () => {
  it("o shell do painel declara a escala compacta", () => {
    expect(read("src/components/layout/shell-frame.tsx")).toContain('data-density="compact"');
  });

  it("as telas de autenticação usam a mesma escala do painel", () => {
    // login e redefinição de senha montam os mesmos campos do painel
    expect(read("src/components/layout/auth-screen.tsx")).toContain('data-density="compact"');
  });

  it("a escala compacta está definida no CSS", () => {
    expect(read("src/app/globals.css")).toMatch(
      /\[data-density="compact"\]\s*\{\s*font-size:\s*14px;/,
    );
  });

  it("o corpo do documento continua em 16px, para o site público", () => {
    const globals = read("src/app/globals.css");
    // a primeira regra `body` só zera altura; a que interessa é a que pinta
    const rule = globals.split(/\bbody \{/).find((block) => block.includes("font-family"));
    expect(rule?.slice(0, rule.indexOf("}"))).toContain("font-size: 16px;");
  });

  /**
   * O Tailwind 3 punha a mãozinha em `<button>` pelo preflight e o 4 tirou a
   * regra. Sem ela o painel inteiro fica sem o único sinal de que algo é
   * clicável, e a falha é silenciosa: nada quebra, o botão só deixa de
   * parecer botão. Voltou como regra nossa — e volta a sumir no dia em que
   * alguém mexer no preflight, então fica travada aqui.
   */
  it("botão continua com a mãozinha", () => {
    const globals = read("src/app/globals.css");
    expect(globals).toMatch(/button:not\(:disabled\)/);
    expect(globals).toMatch(/cursor: pointer;/);
  });

  it("mantém os quatro níveis de raio, na ordem card > interno > tag", () => {
    const tokens = read("src/app/design-tokens.css");
    const px = (name: string) => {
      const match = tokens.match(new RegExp(`--radius-${name}:\\s*(\\d+)px`));
      if (!match) throw new Error(`--radius-${name} sumiu`);
      return Number(match[1]);
    };

    expect(px("card")).toBeGreaterThan(px("inner"));
    expect(px("inner")).toBeGreaterThan(px("tag"));
    // botão continua pílula — é assinatura do C4MP
    expect(tokens).toContain("--radius-pill: 9999px;");
  });
});
