/**
 * O evento de marketing, num formato só.
 *
 * Meta, GA4 e Google Ads querem a mesma informação com nomes diferentes.
 * Quem dispara (um lead do site, um lead de portal, um carro vendido) monta
 * este objeto uma vez; cada conector traduz para o que a plataforma dele
 * espera. Assim o lugar que sabe "aconteceu uma venda" não precisa saber
 * nada sobre pixel, e ligar uma plataforma nova não mexe em quem dispara.
 */

export const TRACKED_EVENTS = ["lead", "sale", "view_item"] as const;
export type TrackedEventName = (typeof TRACKED_EVENTS)[number];

export type TrackedUser = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  /** IP e user-agent de quem navegou: a Meta usa os dois para casar a pessoa. */
  ip?: string | null;
  userAgent?: string | null;
  /**
   * Cookies do pixel da Meta no navegador. São o que mais aumenta a taxa de
   * correspondência na API de Conversões — sem eles, sobra e-mail e telefone
   * com hash, que nem todo lead traz.
   */
  fbp?: string | null;
  fbc?: string | null;
  /**
   * Identificador do dispositivo no GA4 (`_ga`). Sem ele o evento entra como
   * uma sessão nova, e a venda não gruda na campanha que trouxe a visita.
   */
  ga4ClientId?: string | null;
};

export type TrackedContent = {
  id?: string | null;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
};

export type TrackedEvent = {
  name: TrackedEventName;
  /**
   * O mesmo id que o navegador mandou no pixel.
   *
   * É o que faz a Meta entender que o evento do navegador e o do servidor são
   * o MESMO — sem ele, a mesma conversão é contada duas vezes e o custo por
   * lead aparece pela metade nos relatórios.
   */
  eventId: string;
  occurredAt?: Date;
  /** Em reais. Venda leva o preço do carro; lead pode ir sem valor. */
  value?: number | null;
  user?: TrackedUser;
  content?: TrackedContent;
  /** Página onde aconteceu, quando existe. */
  sourceUrl?: string | null;
};

/** Nome do evento em cada plataforma. */
export const META_EVENT_NAMES: Record<TrackedEventName, string> = {
  lead: "Lead",
  sale: "Purchase",
  view_item: "ViewContent",
};

export const GA4_EVENT_NAMES: Record<TrackedEventName, string> = {
  lead: "generate_lead",
  sale: "purchase",
  view_item: "view_item",
};

/**
 * Id novo para um evento, quando quem dispara não tem um do navegador.
 *
 * É o caso do lead de portal e da venda marcada no painel: ninguém abriu
 * página nenhuma, então não há o que deduplicar — mas o id continua sendo o
 * que impede o mesmo evento de entrar duas vezes se a chamada for repetida.
 */
export function newEventId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
