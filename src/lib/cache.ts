import { getBindings } from "./cloudflare";

/**
 * Cache no KV do Webflow Cloud.
 * Atenção: escritas propagam globalmente em até 60s — por isso TTLs curtos
 * e invalidação explícita em toda mutação.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  let kv;
  try {
    kv = (await getBindings()).CACHE;
  } catch {
    return loader();
  }
  if (!kv) return loader();

  try {
    const hit = await kv.get(key, "json");
    if (hit !== null && hit !== undefined) return hit as T;
  } catch {
    // cache indisponível: segue para o loader
  }

  const value = await loader();
  try {
    if (value !== undefined) {
      await kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttlSeconds) });
    }
  } catch {
    // falha de escrita no cache não pode derrubar a request
  }
  return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
  try {
    const { CACHE } = await getBindings();
    if (!CACHE) return;
    await Promise.all(keys.map((key) => CACHE.delete(key)));
  } catch {
    // ignora
  }
}

export const cacheKeys = {
  tenantCoreById: (id: string) => `tenant:core:id:${id}`,
  tenantCoreBySlug: (slug: string) => `tenant:core:slug:${slug}`,
  tenantSite: (slug: string) => `tenant:site:${slug}`,
};
