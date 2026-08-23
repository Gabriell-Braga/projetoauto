import { getObject } from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

/**
 * Serve arquivos do Object Storage.
 * O Webflow Cloud não suporta bucket público, então todo asset passa por aqui.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.map((segment) => decodeURIComponent(segment)).join("/");

  if (objectKey.includes("..")) {
    return new Response("Chave inválida", { status: 400 });
  }

  const object = await getObject(objectKey);
  if (!object) return new Response("Arquivo não encontrado", { status: 404 });

  const headers = new Headers();
  headers.set("content-type", object.httpMetadata?.contentType ?? "application/octet-stream");
  headers.set("cache-control", "public, max-age=31536000, immutable");
  if (object.httpEtag) headers.set("etag", object.httpEtag);

  return new Response(object.body as unknown as ReadableStream, { headers });
}
