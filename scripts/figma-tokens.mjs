/**
 * Extrai o sistema de design de .figma/document.json para algo que dê para ler.
 *
 *   node --max-old-space-size=4096 scripts/figma-tokens.mjs
 *
 * O documento cru tem dezenas de megabytes de nós aninhados — não serve para
 * consulta humana nem para revisão. Este script destila as três coisas que
 * viram código: paleta, tipografia e o inventário de páginas por template.
 */
import { readFileSync, writeFileSync } from "node:fs";

const IN = ".figma/document.json";
const OUT = ".figma/tokens.json";

const HEX = /#([0-9a-fA-F]{6})\b/;

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

/** O texto que a camada mostra na tela, não o nome dela na árvore. */
function textOf(node) {
  return (node.characters ?? node.name ?? "").trim();
}

/**
 * Cores nomeadas da página de fundações.
 *
 * Os três templates escrevem o swatch de jeitos diferentes — num deles o nome
 * e o hex vivem no mesmo rótulo ("Brand #0F5FD7"), nos outros são camadas de
 * texto irmãs. O que os três têm em comum é: existe um bloco que contém
 * exatamente UM hex, e o nome da cor é o outro texto ali dentro.
 *
 * A leitura vem do texto, não do preenchimento do retângulo: a amostra às
 * vezes tem opacidade, borda ou sobreposição, e o valor lido dela sairia
 * diferente do que a pessoa escreveu ao lado.
 */
function palette(page) {
  const found = new Map();

  function textsIn(node) {
    const out = [];
    walk(node, (item) => {
      if (item.type === "TEXT") out.push(textOf(item));
    });
    return out;
  }

  function scan(node) {
    for (const child of node.children ?? []) {
      const texts = textsIn(child);
      const hexes = texts.filter((text) => HEX.test(text));

      if (hexes.length === 1) {
        const value = `#${hexes[0].match(HEX)[1].toUpperCase()}`;
        // rótulo é o texto curto sem hex; parágrafo de descrição não serve
        const label =
          texts.find((text) => !HEX.test(text) && text.length > 0 && text.length <= 32) ??
          hexes[0].replace(HEX, "").trim();

        // parágrafo que cita uma cor no meio da prosa não é swatch
        if (label && label.length <= 32) found.set(label, value);
        continue; // este bloco é o swatch: não desce mais
      }

      scan(child);
    }
  }

  scan(page);
  return Object.fromEntries(found);
}

/**
 * Estilos de texto realmente usados, varrendo o template inteiro.
 *
 * Só a página de fundações não basta: uma fonte de display costuma aparecer
 * apenas nas telas, e ficaria de fora do inventário justamente a que dá
 * personalidade ao template.
 */
function typography(pages) {
  const found = new Map();

  for (const page of pages) {
    walk(page, (node) => {
      const style = node.style;
      if (node.type !== "TEXT" || !style?.fontFamily) return;

      const key = `${style.fontFamily}|${style.fontWeight}|${Math.round(style.fontSize)}`;
      if (found.has(key)) return;

      found.set(key, {
        family: style.fontFamily,
        weight: style.fontWeight,
        size: Math.round(style.fontSize),
        lineHeight: style.lineHeightPx ? Math.round(style.lineHeightPx) : null,
      });
    });
  }

  return [...found.values()].sort((a, b) => b.size - a.size || a.family.localeCompare(b.family));
}

/** Raios de canto, com quantas vezes cada um aparece — o raro é exceção, não token. */
function radii(pages) {
  const count = new Map();
  for (const page of pages) {
    walk(page, (node) => {
      if (typeof node.cornerRadius === "number" && node.cornerRadius > 0) {
        count.set(node.cornerRadius, (count.get(node.cornerRadius) ?? 0) + 1);
      }
    });
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, times]) => ({ raio: value, vezes: times }));
}

const doc = JSON.parse(readFileSync(IN, "utf8"));
const pages = doc.document.children ?? [];

/*
 * Agrupamento por nome de página.
 *
 * As páginas vêm como "NN Template 0X — Assunto", mas as duas primeiras são
 * só "01 Foundations" e "02 Components" — pertencem ao template 01 sem dizer.
 * Como a ordem no arquivo é a ordem de leitura, quem não se declara herda o
 * último template declarado.
 */
const templates = new Map();
let current = "template-01";

for (const page of pages) {
  const match = page.name.match(/Template\s*0?(\d+)/i);
  if (match) current = `template-0${match[1]}`;
  if (!templates.has(current)) templates.set(current, []);
  templates.get(current).push(page);
}

const result = {};
for (const [key, group] of templates) {
  const foundations = group.find((page) => /Foundations/i.test(page.name));
  result[key] = {
    paginas: group.map((page) => ({
      nome: page.name.replace(/^\d+\s*/, ""),
      frames: (page.children ?? []).map((frame) => frame.name),
    })),
    paleta: foundations ? palette(foundations) : {},
    tipografia: typography(group),
    raios: radii(group),
  };
}

writeFileSync(OUT, JSON.stringify(result, null, 2));

for (const [key, value] of Object.entries(result)) {
  console.log(`\n${key} — ${value.paginas.length} páginas`);
  console.log("  paleta:");
  for (const [name, hex] of Object.entries(value.paleta)) {
    console.log(`    ${name.padEnd(20)} ${hex}`);
  }
  const families = [...new Set(value.tipografia.map((item) => item.family))];
  console.log("  fontes:", families.join(", ") || "—");
  console.log(
    "  corpos:",
    [...new Set(value.tipografia.map((item) => item.size))].join(", ") || "—",
  );
  console.log(
    "  raios mais usados:",
    value.raios
      .slice(0, 5)
      .map((item) => `${item.raio}px (${item.vezes}x)`)
      .join(", ") || "—",
  );
}
console.log(`\n${OUT}`);
