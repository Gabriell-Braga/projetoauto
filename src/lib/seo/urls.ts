import { headers } from "next/headers";
import { BASE_PATH } from "@/lib/paths";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";

/** Origem pública real (o app roda atrás do domínio do site Webflow). */
export async function getOrigin(): Promise<string> {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:8787";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** URL absoluta de uma página do site da revenda, já com o mount path. */
export async function tenantAbsoluteUrl(slug: string, subPath = ""): Promise<string> {
  const origin = await getOrigin();
  return `${origin}${tenantPublicPath(slug, subPath)}`;
}

export function absoluteFromOrigin(origin: string, path: string): string {
  if (path.startsWith("http")) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export { BASE_PATH };
