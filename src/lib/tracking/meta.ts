import { META_EVENT_NAMES, type TrackedEvent } from "./event";
import { hashed, normalizeEmail, normalizePhone, splitName } from "./identity";

/**
 * API de Conversões da Meta (server-side).
 *
 * Por que existe, já que o pixel do navegador manda o mesmo evento: bloqueador
 * de anúncio, iOS e fim do cookie de terceiro derrubam boa parte dos disparos
 * do navegador. O que sai do servidor não depende do navegador de ninguém — e
 * a venda, que acontece dias depois e dentro do painel, não tem navegador
 * nenhum para disparar.
 *
 * O `event_id` é o mesmo dos dois lados: é assim que a Meta entende que são o
 * mesmo evento e não conta duas vezes.
 *
 * Referência: Conversions API, POST /{pixel_id}/events.
 */

const GRAPH_VERSION = "v21.0";

export type MetaConfig = {
  pixelId: string;
  accessToken: string;
  /** Código de teste do Gerenciador de Eventos; só em conferência. */
  testEventCode?: string | null;
};

export type MetaResult = { ok: true; received: number } | { ok: false; error: string };

export async function buildMetaPayload(event: TrackedEvent, config: MetaConfig) {
  const user = event.user ?? {};
  const { first, last } = splitName(user.name);

  /*
   * Só entra no user_data o que existe: campo com string vazia conta como
   * "mandei e não bateu" e derruba a qualidade da correspondência que a Meta
   * mostra no painel.
   */
  const userData: Record<string, unknown> = {};
  const em = await hashed(normalizeEmail(user.email));
  const ph = await hashed(normalizePhone(user.phone));
  const fn = await hashed(first);
  const ln = await hashed(last);

  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (fn) userData.fn = [fn];
  if (ln) userData.ln = [ln];
  if (user.ip) userData.client_ip_address = user.ip;
  if (user.userAgent) userData.client_user_agent = user.userAgent;
  if (user.fbp) userData.fbp = user.fbp;
  if (user.fbc) userData.fbc = user.fbc;

  const customData: Record<string, unknown> = {};
  if (event.value != null) {
    customData.value = Number(event.value.toFixed(2));
    customData.currency = "BRL";
  }
  if (event.content?.id) {
    customData.content_ids = [event.content.id];
    customData.content_type = "vehicle";
  }
  if (event.content?.name) customData.content_name = event.content.name;

  return {
    data: [
      {
        event_name: META_EVENT_NAMES[event.name],
        event_time: Math.floor((event.occurredAt ?? new Date()).getTime() / 1000),
        event_id: event.eventId,
        /*
         * `system_generated` seria o certo para o que nasce no painel, mas a
         * Meta só aceita os valores da lista dela; "website" com o evento
         * vindo do servidor é o que eles documentam para CRM ligado ao site.
         */
        action_source: "website",
        ...(event.sourceUrl ? { event_source_url: event.sourceUrl } : {}),
        user_data: userData,
        ...(Object.keys(customData).length > 0 ? { custom_data: customData } : {}),
      },
    ],
    ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
  };
}

export async function sendMetaEvent(
  event: TrackedEvent,
  config: MetaConfig,
  fetcher: typeof fetch = fetch,
): Promise<MetaResult> {
  const payload = await buildMetaPayload(event, config);

  try {
    const response = await fetcher(
      `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, access_token: config.accessToken }),
        signal: AbortSignal.timeout(8000),
      },
    );

    const body = (await response.json().catch(() => ({}))) as {
      events_received?: number;
      error?: { message?: string; error_user_msg?: string };
    };

    if (!response.ok) {
      return {
        ok: false,
        error:
          body.error?.error_user_msg ??
          body.error?.message ??
          `A Meta recusou o evento (HTTP ${response.status}).`,
      };
    }
    return { ok: true, received: body.events_received ?? 1 };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
