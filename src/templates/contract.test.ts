import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, WHATSAPP_GREEN, themeToCssVariables } from "./contract";

/**
 * O tema é o contrato entre a revenda e o template.
 *
 * O defeito que este teste existe para pegar: alguém acrescenta um token em
 * `ThemeTokens`, dá o valor padrão, e esquece de emitir a variável CSS. O
 * TypeScript fica satisfeito — o tipo está completo —, o build passa, e o
 * template recebe uma custom property que nunca foi definida. O navegador
 * resolve isso como vazio, então a cor some ou vira preto, e só aparece
 * olhando o site publicado.
 */
describe("tema dos templates", () => {
  const vars = themeToCssVariables(DEFAULT_THEME);

  it("emite uma variável CSS para cada token do tema", () => {
    const semVariavel = Object.keys(DEFAULT_THEME).filter((token) => {
      // primaryForeground -> --site-primary-foreground
      const nome = `--site-${token.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`;
      return !(nome in vars);
    });

    expect(
      semVariavel,
      `Token sem variável CSS: o template recebe vazio e a cor some.\n${semVariavel.join(", ")}`,
    ).toEqual([]);
  });

  it("não emite variável que não venha de um token", () => {
    // exceto o verde do WhatsApp, que é fixo de propósito
    const conhecidos = new Set(
      Object.keys(DEFAULT_THEME).map(
        (token) => `--site-${token.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`)}`,
      ),
    );
    conhecidos.add("--site-whatsapp");

    const sobrando = Object.keys(vars).filter((nome) => !conhecidos.has(nome));
    expect(sobrando).toEqual([]);
  });

  it("nenhum valor padrão vem vazio", () => {
    const vazios = Object.entries(DEFAULT_THEME)
      .filter(([, valor]) => !valor || String(valor).trim() === "")
      .map(([token]) => token);

    expect(vazios).toEqual([]);
  });

  /**
   * O verde do WhatsApp não é do tema.
   *
   * É marca de terceiro: uma revenda que pintasse o botão de roxo perderia o
   * reconhecimento instantâneo, que é o valor inteiro daquele botão.
   */
  it("o verde do WhatsApp é fixo, fora do tema", () => {
    expect(WHATSAPP_GREEN).toMatch(/^#[0-9A-F]{6}$/i);
    expect(Object.values(DEFAULT_THEME)).not.toContain(WHATSAPP_GREEN);
    expect(vars["--site-whatsapp"]).toBe(WHATSAPP_GREEN);
  });

  it("o raio vem com unidade, para entrar direto no CSS", () => {
    // "12" sozinho é ignorado pelo border-radius e o card sai quadrado
    expect(DEFAULT_THEME.radius).toMatch(/^\d+(px|rem)$/);
  });
});
