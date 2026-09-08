/**
 * O endereco do painel, arrumado.
 *
 * Esta variavel e digitada a mao num painel da Vercel, e as duas formas de
 * errar sao sempre as mesmas: esquecer o `https://` e deixar a barra no fim.
 * As duas quebram de um jeito que nao aponta para a causa — sem esquema, o
 * Next recusa o `rewrites()` inteiro com "Invalid rewrite found", sem dizer
 * qual variavel esta errada; com a barra, todas as URLs saem com `//` no meio.
 *
 * Entao aqui as duas sao consertadas em silencio, e o que sobra — valor
 * ausente ou que nem parece endereco — falha no BUILD, com o nome da variavel
 * na mensagem. Melhor que descobrir em producao, com "fetch failed" em toda
 * pagina.
 */
export function normalizePanelUrl(raw: string | undefined): string {
  const valor = raw?.trim();

  if (!valor) {
    throw new Error(
      "PANEL_URL não está definida. É o endereço do painel " +
        "(ex.: https://projetoauto.webflow.io), de onde este app lê os dados dos sites.",
    );
  }

  const comEsquema = /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
  const semBarra = comEsquema.replace(/\/+$/, "");

  try {
    // so interessa se o construtor aceita; o objeto em si nao serve para nada
    new URL(semBarra);
  } catch {
    throw new Error(
      `PANEL_URL não parece um endereço válido: ${valor}. ` +
        "Use algo como https://projetoauto.webflow.io.",
    );
  }

  return semBarra;
}

let memoria: string | null = null;

/**
 * O endereço já normalizado, para quem só quer usar.
 *
 * É função, e não `const`, porque uma constante de módulo seria avaliada na
 * IMPORTAÇÃO: qualquer teste que encostasse neste arquivo passaria a exigir a
 * variável definida só para carregar o módulo. Quem precisa da falha cedo é o
 * build, e lá o `next.config` chama `normalizePanelUrl` diretamente.
 */
export function panelUrl(): string {
  if (memoria === null) memoria = normalizePanelUrl(process.env.PANEL_URL);
  return memoria;
}
