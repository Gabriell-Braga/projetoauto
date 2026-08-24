import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getBindings } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

/** Um ano: as chaves incluem um uuid, então o conteúdo nunca muda no mesmo caminho. */
const MAX_AGE = 31536000;

/**
 * Serve arquivos do Object Storage.
 *
 * O Webflow Cloud não suporta bucket público, então todo asset passa por aqui.
 * Como request é o recurso caro do plano, a rota trabalha em camadas antes de
 * tocar o bucket:
 *   1. etag do navegador bate -> 304 sem corpo;
 *   2. cache do edge -> responde sem ler o R2;
 *   3. leitura no R2 (condicional) e gravação no cache do edge.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.map((segment) => decodeURIComponent(segment)).join("/");

  if (objectKey.includes("..")) {
    return new Response("Chave inválida", { status: 400 });
  }

  const knownEtag = normalizeEtag(request.headers.get("if-none-match"));
  const edgeCache = getEdgeCache();
  const cacheKey = new Request(new URL(request.url).toString(), { method: "GET" });

  // 1 + 2: o cache do edge responde sem tocar no bucket
  const cached = await edgeCache?.match(cacheKey);
  if (cached) {
    if (knownEtag && normalizeEtag(cached.headers.get("etag")) === knownEtag) {
      return notModified(cached.headers);
    }
    return cached;
  }

  const { MEDIA } = await getBindings();

  // Get condicional: o R2 devolve o objeto sem corpo quando o etag ainda vale.
  // Montado à mão porque o Headers do Next não é a classe que o binding espera.
  const object = await MEDIA.get(
    objectKey,
    knownEtag ? { onlyIf: { etagDoesNotMatch: knownEtag } } : undefined,
  );
  if (!object) return new Response("Arquivo não encontrado", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("cache-control", `public, max-age=${MAX_AGE}, immutable`);
  if (object.httpEtag) headers.set("etag", object.httpEtag);

  const hasBody = "body" in object && object.body;
  if (!hasBody || (knownEtag && normalizeEtag(object.httpEtag) === knownEtag)) {
    return notModified(headers);
  }

  headers.set("content-length", String(object.size));
  const response = new Response(object.body as unknown as ReadableStream, { headers });

  if (edgeCache) {
    const context = await getCloudflareContextSafe();
    context?.ctx.waitUntil(edgeCache.put(cacheKey, response.clone()));
  }

  return response;
}

/** 304 carrega validação e cache, nunca corpo nem content-length. */
function notModified(source: Headers): Response {
  const headers = new Headers();
  for (const name of ["etag", "cache-control", "content-type"]) {
    const value = source.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(null, { status: 304, headers });
}

function normalizeEtag(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/^W\//, "").replaceAll('"', "").trim();
  return normalized || null;
}

type EdgeCache = {
  match: (request: Request) => Promise<Response | undefined>;
  put: (request: Request, response: Response) => Promise<void>;
};

/** `caches.default` só existe no runtime de Workers. */
function getEdgeCache(): EdgeCache | null {
  return (globalThis as { caches?: { default?: EdgeCache } }).caches?.default ?? null;
}

async function getCloudflareContextSafe() {
  try {
    return await getCloudflareContext({ async: true });
  } catch {
    return null;
  }
}
