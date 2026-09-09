/**
 * Logo e favicon da revenda de teste, desenhados aqui mesmo.
 *
 * TEMPORÁRIO, como o resto da semeadura.
 *
 * São SVG montados como texto porque o runtime de Workers não tem biblioteca
 * de imagem — não há como compor um PNG lá. E SVG é o formato certo para
 * ícone de qualquer forma: resolve em qualquer tamanho sem serrilhar.
 *
 * O desenho é deliberadamente sóbrio: um monograma numa forma sólida. Loja de
 * seminovos raramente tem marca elaborada, e uma logo pretensiosa aqui
 * denunciaria que o conteúdo é de mentira mais rápido que um texto errado.
 */

const AZUL = "#1D4ED8";
const ESCURO = "#0F172A";

/** Marca horizontal para o cabeçalho do site: monograma + nome. */
export function logoSvg(nome: string, iniciais: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 72" width="320" height="72" role="img" aria-label="${escapar(nome)}">
  <rect x="0" y="8" width="56" height="56" rx="14" fill="${AZUL}"/>
  <text x="28" y="45" text-anchor="middle" font-family="DM Sans, Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" fill="#FFFFFF">${escapar(iniciais)}</text>
  <text x="70" y="34" font-family="DM Sans, Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="${ESCURO}">${escapar(nome)}</text>
  <text x="70" y="54" font-family="DM Sans, Segoe UI, Arial, sans-serif" font-size="13" font-weight="500" fill="#64748B" letter-spacing="1.5">SEMINOVOS</text>
</svg>`;
}

/**
 * Ícone da aba: só o monograma.
 *
 * Numa caixa de 16 px o nome da loja vira borrão. O que identifica ali é a
 * cor e a forma, então o favicon carrega só isso.
 */
export function faviconSvg(iniciais: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="${AZUL}"/>
  <text x="32" y="44" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="700" fill="#FFFFFF">${escapar(iniciais)}</text>
</svg>`;
}

/** Duas letras: as iniciais das duas primeiras palavras que não são partícula. */
export function iniciaisDe(nome: string): string {
  const ignorar = new Set(["de", "da", "do", "das", "dos", "e", "ltda", "me", "eireli", "sa"]);
  const palavras = nome
    .split(/\s+/)
    .map((parte) => parte.replace(/[^A-Za-zÀ-ÿ]/g, ""))
    .filter((parte) => parte.length > 0 && !ignorar.has(parte.toLowerCase()));

  const letras = palavras.slice(0, 2).map((parte) => parte[0].toUpperCase());
  return letras.join("") || nome.slice(0, 2).toUpperCase();
}

function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
