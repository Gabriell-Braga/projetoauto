import { getBindings } from "./cloudflare";

export type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Rate limit simples baseado em contador no KV.
 * Suficiente para login e formulário público de leads — não é preciso ser exato.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const { CACHE } = await getBindings();
    if (!CACHE) return { allowed: true, remaining: limit };

    const fullKey = `rl:${key}`;
    const current = Number((await CACHE.get(fullKey)) ?? 0);
    if (current >= limit) return { allowed: false, remaining: 0 };

    await CACHE.put(fullKey, String(current + 1), { expirationTtl: Math.max(60, windowSeconds) });
    return { allowed: true, remaining: limit - current - 1 };
  } catch {
    // se o KV falhar, não bloqueia o usuário legítimo
    return { allowed: true, remaining: limit };
  }
}

export async function resetRateLimit(key: string): Promise<void> {
  try {
    const { CACHE } = await getBindings();
    await CACHE?.delete(`rl:${key}`);
  } catch {
    // ignora
  }
}
