/**
 * Aplica as migrations no banco remoto.
 *
 *   node scripts/migrate-remote.mjs [url-do-painel]
 *
 * Le o OPS_SECRET do `.dev.vars` e manda no cabecalho. O segredo nunca vira
 * argumento de linha de comando — argumento aparece no historico do shell e na
 * lista de processos da maquina.
 *
 * As migrations sao EMBUTIDAS no build. Uma migration recem-commitada so chega
 * ao banco depois de o painel ser publicado; rodar isto antes do deploy aplica
 * o que ja estava la, e nao a nova.
 */
import { readFileSync } from "node:fs";

const PADRAO = "https://projetoauto.webflow.io/app";

function lerDevVars(nome) {
  let conteudo;
  try {
    conteudo = readFileSync(".dev.vars", "utf8");
  } catch {
    throw new Error("Nao encontrei .dev.vars na raiz do projeto.");
  }

  for (const linha of conteudo.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;

    const corte = limpa.indexOf("=");
    if (corte < 0 || limpa.slice(0, corte).trim() !== nome) continue;

    /*
     * As aspas em volta sao delimitador do arquivo, nao parte do valor.
     * O wrangler as remove ao carregar o .dev.vars; quem le o arquivo na mao
     * precisa fazer o mesmo, ou manda o segredo com aspas e leva um 403 que
     * parece "o segredo esta errado".
     */
    return limpa
      .slice(corte + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
  }

  throw new Error(`${nome} nao esta no .dev.vars.`);
}

const base = (process.argv[2] ?? PADRAO).replace(/\/+$/, "");
const segredo = lerDevVars("OPS_SECRET");

const resposta = await fetch(`${base}/api/ops/migrate`, {
  method: "POST",
  headers: { "x-ops-secret": segredo },
});

const texto = await resposta.text();

if (!resposta.ok) {
  console.error(`Falhou (${resposta.status}): ${texto}`);
  if (resposta.status === 403) {
    console.error(
      "\nO OPS_SECRET do .dev.vars nao bate com o das Secret Variables do painel.",
    );
  }
  process.exit(1);
}

const { data } = JSON.parse(texto);
const linha = (rotulo, lista) =>
  console.log(`${rotulo}: ${lista.length ? lista.join(", ") : "nenhuma"}`);

linha("Aplicadas", data.applied ?? []);
linha("Ja estavam", data.skipped ?? []);

// "tolerado" = comando que falhou com "already exists"; normal em banco que
// recebeu parte das migrations por outro caminho
const tolerados = Object.entries(data.tolerated ?? {});
if (tolerados.length) {
  console.log(
    `Comandos tolerados: ${tolerados.map(([m, n]) => `${m} (${n})`).join(", ")}`,
  );
}
