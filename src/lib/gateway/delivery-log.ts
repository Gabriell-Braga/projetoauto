import { getBindings } from "@/lib/cloudflare";

const REJECTED_KEY = "asaas:webhook:last-rejected";
const ACCEPTED_KEY = "asaas:webhook:last-accepted";
const TTL_SECONDS = 60 * 60 * 24 * 30;

export type DeliveryMark = { at: string; detail?: string };

/**
 * Registro mínimo das entregas do webhook, no KV.
 *
 * Entrega recusada não pode virar linha no banco — o corpo vem de quem não
 * autenticou, e gravar por requisição seria porta aberta para encher a tabela.
 * Uma chave única sobrescrita resolve: diz que alguém bateu, quando, e que foi
 * recusado. É o suficiente para separar "o gateway não chamou" de "o gateway
 * chamou e o token não confere" — que dão exatamente a mesma tela.
 */
async function mark(key: string, detail?: string): Promise<void> {
  try {
    const { CACHE } = await getBindings();
    if (!CACHE) return;
    const value: DeliveryMark = { at: new Date().toISOString(), detail };
    await CACHE.put(key, JSON.stringify(value), { expirationTtl: TTL_SECONDS });
  } catch {
    // diagnóstico nunca pode derrubar a entrega
  }
}

async function read(key: string): Promise<DeliveryMark | null> {
  try {
    const { CACHE } = await getBindings();
    if (!CACHE) return null;
    return ((await CACHE.get(key, "json")) as DeliveryMark | null) ?? null;
  } catch {
    return null;
  }
}

export const markRejectedDelivery = (detail?: string) => mark(REJECTED_KEY, detail);
export const markAcceptedDelivery = (eventType?: string) => mark(ACCEPTED_KEY, eventType);

export async function lastDeliveries(): Promise<{
  rejected: DeliveryMark | null;
  accepted: DeliveryMark | null;
}> {
  const [rejected, accepted] = await Promise.all([read(REJECTED_KEY), read(ACCEPTED_KEY)]);
  return { rejected, accepted };
}
