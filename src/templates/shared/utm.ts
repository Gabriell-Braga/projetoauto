/**
 * De onde a visita veio, para o lead carregar a origem.
 *
 * Fica num módulo próprio porque os três formulários públicos precisam do
 * mesmo dado — contato, financiamento e "venda seu carro". Quando isso vivia
 * dentro de um deles, o segundo formulário nasceria sem origem nenhuma e a
 * revenda concluiria que a campanha não converteu.
 */

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

export type UtmPayload = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  referrer?: string;
  page?: string;
};

/**
 * Lê os `utm_*` da URL mais o referrer e a página.
 *
 * Roda só no navegador; no servidor devolve vazio em vez de quebrar, porque
 * os formulários são renderizados dos dois lados.
 */
export function readUtm(): UtmPayload {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  const utm: UtmPayload = {
    referrer: document.referrer || undefined,
    page: window.location.pathname,
  };

  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`);
    // o corte em 120 acompanha o limite do schema: campanha comprida vinda de
    // anúncio não pode derrubar o envio do lead
    if (value) utm[key] = value.slice(0, 120);
  }

  return utm;
}
