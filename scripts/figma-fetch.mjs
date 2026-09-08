/**
 * Baixa um arquivo do Figma para dentro de .figma/, para servir de base na
 * construção dos templates.
 *
 *   node --env-file=.dev.vars scripts/figma-fetch.mjs "<url do figma>"
 *
 * O `--env-file` é do próprio Node: ele lê o .dev.vars, que já é o lugar dos
 * segredos deste projeto e já está no .gitignore. É melhor que exportar a
 * variável no shell, porque `export FIGMA_TOKEN=...` deixa o token no
 * histórico do terminal para sempre.
 *
 * O token nunca é impresso, nem em erro. Ele é credencial da conta inteira do
 * Figma, não deste arquivo — quem pegar ele lê todos os arquivos da pessoa.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = ".figma";
const API = "https://api.figma.com/v1";

/**
 * Extrai a chave do arquivo e o nó da URL que a pessoa copia do navegador.
 *
 * A URL tem formatos diferentes conforme o tipo de arquivo (/design/, /file/)
 * e o node-id vem com hífen na URL e com dois-pontos na API — trocar isso na
 * mão é o erro que faz a chamada voltar 404 sem explicar por quê.
 */
export function parseFigmaUrl(input) {
  const match = input.match(/figma\.com\/(?:design|file)\/([0-9a-zA-Z]{22,128})/);
  if (!match) {
    throw new Error(
      "URL não reconhecida. Use o endereço de um arquivo de design, com /design/ no caminho.",
    );
  }

  const nodeParam = input.match(/[?&]node-id=([^&]+)/);
  return {
    fileKey: match[1],
    nodeId: nodeParam ? decodeURIComponent(nodeParam[1]).replace("-", ":") : null,
  };
}

function token() {
  const value = process.env.FIGMA_TOKEN;
  if (!value) {
    throw new Error(
      "FIGMA_TOKEN não encontrado.\n" +
        "Adicione a linha FIGMA_TOKEN=... no .dev.vars e rode com:\n" +
        "  node --env-file=.dev.vars scripts/figma-fetch.mjs \"<url>\"",
    );
  }
  return value;
}

async function api(path) {
  const response = await fetch(`${API}${path}`, {
    headers: { "X-Figma-Token": token() },
  });

  if (response.status === 403) {
    throw new Error(
      "O Figma recusou (403). Ou o token expirou, ou ele não tem o escopo de\n" +
        "leitura de arquivos, ou a conta dele não enxerga este arquivo.",
    );
  }
  if (response.status === 404) {
    throw new Error("Arquivo não encontrado (404). Confira a URL.");
  }
  if (!response.ok) {
    throw new Error(`O Figma respondeu ${response.status}.`);
  }

  return response.json();
}

function save(name, data) {
  mkdirSync(OUT, { recursive: true });
  const path = join(OUT, name);
  writeFileSync(path, typeof data === "string" ? data : JSON.stringify(data, null, 2));
  return path;
}

async function main() {
  const url = process.argv[2];
  if (!url) throw new Error('Faltou a URL. Uso: node ... scripts/figma-fetch.mjs "<url>"');

  const { fileKey, nodeId } = parseFigmaUrl(url);
  console.log(`arquivo ${fileKey}${nodeId ? ` · nó ${nodeId}` : ""}`);

  /*
   * O documento inteiro traz os valores de tudo: preenchimento, tipografia,
   * raio, espaçamento de cada nó. É de onde os tokens saem quando a API de
   * Variables não está disponível — ela é exclusiva de Enterprise.
   */
  const document = await api(`/files/${fileKey}?geometry=paths`);
  console.log(`  ${save("document.json", document)}  (${document.name})`);

  // os estilos publicados guardam os NOMES semânticos; sem eles sobra o valor
  // cru, e "#694AE5" não diz que aquilo é a cor primária
  const styles = await api(`/files/${fileKey}/styles`);
  console.log(`  ${save("styles.json", styles)}`);

  if (nodeId) {
    const node = await api(`/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`);
    console.log(`  ${save("node.json", node)}`);

    // a imagem renderizada é a referência visual: o JSON diz as medidas, o PNG
    // diz se ficou parecido
    const image = await api(
      `/images/${fileKey}?ids=${encodeURIComponent(nodeId)}&format=png&scale=2`,
    );
    const link = image?.images?.[nodeId];
    if (link) {
      const png = Buffer.from(await (await fetch(link)).arrayBuffer());
      mkdirSync(OUT, { recursive: true });
      writeFileSync(join(OUT, "frame.png"), png);
      console.log(`  ${join(OUT, "frame.png")}`);
    }
  }

  console.log("\npronto — os arquivos estão em .figma/ (ignorado pelo git)");
}

// só roda quando chamado direto; importado, entrega só as funções puras
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(`
${error.message}`);
    process.exit(1);
  });
}
