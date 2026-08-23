/**
 * O app é montado num mount path do site Webflow (ex.: "/app").
 * `<Link>` e `<Image>` do Next já aplicam o basePath sozinhos, mas
 * `fetch()` manual e `<img src>` cru precisam do prefixo explícito.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return `${BASE_PATH}/${path}`;
  return `${BASE_PATH}${path}`;
}

export const apiUrl = withBasePath;

/** URL da imagem servida pelo bucket privado (R2) via route handler. */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return withBasePath(`/api/media/${key}`);
}
