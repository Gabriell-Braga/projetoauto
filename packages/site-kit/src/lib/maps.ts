import type { SiteData } from "../templates/contract";

/**
 * Mapa incorporado a partir do endereco da loja.
 *
 * Usa a incorporacao classica do Google Maps, que aceita uma busca em texto e
 * NAO exige chave de API. A alternativa oficial (Maps Embed API) cobraria uma
 * chave por instalacao e uma conta de faturamento — para mostrar onde fica uma
 * loja, e caro demais em cerimonia.
 *
 * O endereco vai como busca, e nao como coordenada, porque coordenada e o que
 * a revenda NAO tem: ela digita rua, numero e cidade no cadastro.
 */
export function mapsEmbedUrl(contact: SiteData["contact"]): string | null {
  const busca = [
    contact.address.street,
    contact.address.number,
    contact.address.district,
    contact.address.city,
    contact.address.state,
    contact.address.zip,
  ]
    .filter(Boolean)
    .join(", ");

  if (!busca) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(busca)}&output=embed`;
}

/**
 * Link para abrir o mapa fora do site.
 *
 * Montado do mesmo endereco do incorporado, para os dois nunca apontarem para
 * lugares diferentes. Um `mapsUrl` cadastrado a mao vence: e o caso da loja
 * que tem ficha propria no Google e quer levar para ela, com foto e avaliacao,
 * em vez de uma busca por endereco.
 */
export function mapsLinkUrl(contact: SiteData["contact"]): string | null {
  if (contact.mapsUrl) return contact.mapsUrl;

  const embed = mapsEmbedUrl(contact);
  if (!embed) return null;
  return embed.replace("&output=embed", "");
}
