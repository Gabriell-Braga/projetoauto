import { GA4_EVENT_NAMES, type TrackedEvent } from "./event";

/**
 * Measurement Protocol do GA4 (server-side).
 *
 * É como o que acontece fora do navegador entra no Google Analytics: lead que
 * chegou por portal, venda marcada no painel dias depois. Sem isso, o GA da
 * revenda mostra visita e formulário, e a venda — que é o que interessa —
 * nunca aparece ao lado da campanha que a trouxe.
 *
 * O `client_id` é o que gruda o evento na sessão original. Quando ele existe
 * (veio do cookie `_ga` do site), a venda entra na mesma jornada da visita;
 * quando não existe, o evento entra como um usuário novo — ainda conta como
 * conversão, mas sem a origem. Por isso o formulário do site manda o
 * `client_id` junto com o lead.
 *
 * Referência: Measurement Protocol (GA4), POST /mp/collect.
 */

export type Ga4Config = {
  measurementId: string;
  apiSecret: string;
};

export type Ga4Result = { ok: true } | { ok: false; error: string };

/** Sem cookie do GA, um id estável por evento — melhor que perder o evento. */
function fallbackClientId(eventId: string): string {
  let hash = 0;
  for (let index = 0; index < eventId.length; index++) {
    hash = (hash * 31 + eventId.charCodeAt(index)) >>> 0;
  }
  return `${hash}.${Math.floor(Date.now() / 1000)}`;
}

export function buildGa4Payload(event: TrackedEvent) {
  const params: Record<string, unknown> = {
    /*
     * A sessão é obrigatória para o evento aparecer nos relatórios padrão.
     * Sem `session_id`, ele entra só na exploração livre — e a revenda abre o
     * GA, não vê a conversão e conclui que a integração não funciona.
     */
    session_id: Math.floor((event.occurredAt ?? new Date()).getTime() / 1000),
    engagement_time_msec: 1,
  };

  if (event.value != null) {
    params.value = Number(event.value.toFixed(2));
    params.currency = "BRL";
  }
  if (event.name === "sale") params.transaction_id = event.eventId;
  if (event.sourceUrl) params.page_location = event.sourceUrl;

  if (event.content?.id) {
    params.items = [
      {
        item_id: event.content.id,
        item_name: event.content.name ?? undefined,
        item_brand: event.content.brand ?? undefined,
        item_category: event.content.model ?? undefined,
        ...(event.value != null ? { price: Number(event.value.toFixed(2)) } : {}),
        quantity: 1,
      },
    ];
  }

  return {
    client_id: event.user?.ga4ClientId || fallbackClientId(event.eventId),
    // milissegundos desde a época, como o MP pede
    timestamp_micros: (event.occurredAt ?? new Date()).getTime() * 1000,
    non_personalized_ads: false,
    events: [{ name: GA4_EVENT_NAMES[event.name], params }],
  };
}

export async function sendGa4Event(
  event: TrackedEvent,
  config: Ga4Config,
  fetcher: typeof fetch = fetch,
): Promise<Ga4Result> {
  try {
    const response = await fetcher(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
        config.measurementId,
      )}&api_secret=${encodeURIComponent(config.apiSecret)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildGa4Payload(event)),
        signal: AbortSignal.timeout(8000),
      },
    );

    /*
     * O MP responde 204 e engole erro de conteúdo em silêncio — ele só valida
     * de verdade no endpoint de depuração. Então aqui "ok" significa que a
     * chamada chegou, não que o evento estava perfeito; a tela diz isso.
     */
    if (!response.ok) {
      return { ok: false, error: `O Google recusou o evento (HTTP ${response.status}).` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
