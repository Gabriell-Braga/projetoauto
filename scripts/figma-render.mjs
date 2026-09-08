/**
 * Renderiza frames do Figma em PNG, para servir de referência visual.
 *
 *   node --env-file=.dev.vars scripts/figma-render.mjs "Home" "Desktop"
 *
 * Primeiro argumento filtra a PÁGINA, o segundo filtra o FRAME — ambos por
 * trecho do nome, sem diferenciar maiúscula. Sem argumentos, lista o que
 * existe em vez de baixar tudo: o arquivo tem mais de cem frames, e baixar
 * todos gasta tempo e cota por nada.
 *
 * O JSON diz as medidas; o PNG diz se ficou parecido. Os dois juntos é o que
 * permite reconstruir sem reabrir o Figma a cada dúvida.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOC = ".figma/document.json";
const META = ".figma/meta.json";
const OUT = ".figma/render";
const API = "https://api.figma.com/v1";

function token() {
  const value = process.env.FIGMA_TOKEN;
  if (!value) throw new Error("FIGMA_TOKEN não encontrado — rode com --env-file=.dev.vars");
  return value;
}

/** Nome de arquivo a partir do nome da camada, que vem com barra, traço e acento. */
function slug(text) {
  return text
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const doc = JSON.parse(readFileSync(DOC, "utf8"));
const { fileKey } = JSON.parse(readFileSync(META, "utf8"));

const [pageFilter, frameFilter] = process.argv.slice(2);

const alvos = [];
for (const page of doc.document.children ?? []) {
  if (pageFilter && !page.name.toLowerCase().includes(pageFilter.toLowerCase())) continue;
  for (const frame of page.children ?? []) {
    if (frameFilter && !frame.name.toLowerCase().includes(frameFilter.toLowerCase())) continue;
    alvos.push({ id: frame.id, page: page.name, frame: frame.name });
  }
}

if (!pageFilter) {
  console.log("páginas e frames disponíveis:\n");
  for (const alvo of alvos) console.log(`  ${alvo.page}  ›  ${alvo.frame}`);
  console.log(`\n${alvos.length} frames. Rode de novo com um filtro para baixar.`);
  process.exit(0);
}

if (alvos.length === 0) {
  console.log("nenhum frame casou com o filtro.");
  process.exit(0);
}

/*
 * Uma chamada só para todos os ids.
 *
 * A API aceita a lista inteira e devolve um link por id — pedir um de cada vez
 * multiplicaria a espera sem ganhar nada.
 */
const ids = alvos.map((alvo) => alvo.id).join(",");
const images = await fetch(
  `${API}/images/${fileKey}?ids=${encodeURIComponent(ids)}&format=png&scale=1`,
  { headers: { "X-Figma-Token": token() } },
).then((response) => response.json());

if (images.err) throw new Error(`O Figma respondeu: ${images.err}`);

mkdirSync(OUT, { recursive: true });

for (const alvo of alvos) {
  const link = images.images?.[alvo.id];
  if (!link) {
    // frame vazio ou grande demais para a Figma rasterizar
    console.log(`  (sem imagem) ${alvo.page} › ${alvo.frame}`);
    continue;
  }

  const bytes = Buffer.from(await (await fetch(link)).arrayBuffer());
  const name = `${slug(alvo.page)}__${slug(alvo.frame)}.png`;
  writeFileSync(join(OUT, name), bytes);
  console.log(`  ${join(OUT, name)}  (${Math.round(bytes.length / 1024)} KB)`);
}

console.log(`\n${alvos.length} frame(s) em ${OUT}/`);
