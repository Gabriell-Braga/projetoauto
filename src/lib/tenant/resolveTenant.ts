import { getTenantCoreBySlug, type TenantCore } from "./service";

/**
 * PONTO ÚNICO DE RESOLUÇÃO DE TENANT.
 *
 * Hoje o Webflow Cloud não suporta domínio próprio por revenda, então a tenancy
 * é por path (`/r/[slug]`). Para migrar no futuro para subdomínio ou domínio custom
 * (via proxy), basta trocar a estratégia aqui — nenhum outro arquivo precisa mudar.
 */
export type TenancyStrategy = "path" | "host";

export const TENANCY_STRATEGY: TenancyStrategy = "path";

export const PUBLIC_SITE_PREFIX = "/r";

/** Hosts que nunca representam um tenant (usados quando a estratégia virar "host"). */
const RESERVED_HOSTS = ["www", "app", "admin", "api"];

export function tenantSlugFromPathname(pathname: string, basePath = ""): string | null {
  let path = pathname;
  if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length);
  const match = /^\/r\/([^/?#]+)/.exec(path);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export function tenantSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const [sub] = host.split(":")[0].split(".");
  if (!sub || RESERVED_HOSTS.includes(sub)) return null;
  return sub.toLowerCase();
}

export function resolveTenantSlug(request: Request, basePath = ""): string | null {
  if (TENANCY_STRATEGY === "host") {
    return tenantSlugFromHost(request.headers.get("host"));
  }
  return tenantSlugFromPathname(new URL(request.url).pathname, basePath);
}

/** Resolve o tenant completo a partir da request (com cache no KV). */
export async function resolveTenant(request: Request, basePath = ""): Promise<TenantCore | null> {
  const slug = resolveTenantSlug(request, basePath);
  if (!slug) return null;
  return getTenantCoreBySlug(slug);
}

/** URL pública da revenda, sempre respeitando o basePath do mount path. */
export function tenantPublicPath(slug: string, subPath = ""): string {
  const suffix = subPath && !subPath.startsWith("/") ? `/${subPath}` : subPath;
  return `${PUBLIC_SITE_PREFIX}/${slug}${suffix}`;
}
