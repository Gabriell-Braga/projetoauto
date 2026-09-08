import { headers } from "next/headers";

/**
 * Endereco absoluto desta pagina, no dominio da revenda.
 *
 * O JSON-LD e as tags Open Graph precisam de URL absoluta, e aqui nao ha um
 * dominio fixo para configurar: cada revenda tem o seu. O `Host` da requisicao
 * e a fonte certa — e a mesma que resolveu de quem e o site.
 *
 * `x-forwarded-proto` vem da borda da Vercel; em desenvolvimento nao existe, e
 * o padrao vira http.
 */
export async function absoluteUrl(path = ""): Promise<string> {
  const head = await headers();
  const host = head.get("host") ?? "";
  const proto = head.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}
