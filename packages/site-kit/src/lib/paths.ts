/**
 * O app é montado num mount path do site Webflow (ex.: "/app").
 * `<Link>` e `<Image>` do Next já aplicam o basePath sozinhos, mas
 * `fetch()` manual e `<img src>` cru precisam do prefixo explícito.
 *
 * Descobrir esse valor no cliente é menos óbvio do que parece: o Webflow Cloud
 * mescla a configuração dele POR CIMA do next.config, então `BASE_URL` pode
 * estar vazio quando o nosso config é avaliado — mesmo com o basePath ativo.
 * Por isso a resolução tem três fontes, da mais confiável para a menos:
 *
 *   1. `__NEXT_ROUTER_BASEPATH` — o próprio valor que o Next inlina e que o
 *      `<Link>` usa. Vale qualquer que tenha sido a origem da configuração;
 *   2. `data-base-path` no <html>, injetado pelo layout raiz em tempo de
 *      request (cobre o caso de o valor só existir no runtime do Worker);
 *   3. `NEXT_PUBLIC_BASE_PATH` explícito, para dev local e outros hosts.
 */
function resolveBasePath(): string {
  const fromNextRouter = (process.env as Record<string, string | undefined>)
    .__NEXT_ROUTER_BASEPATH;
  if (fromNextRouter) return fromNextRouter;

  if (typeof document !== "undefined") {
    const fromDom = document.documentElement.dataset.basePath;
    if (fromDom) return fromDom;
  }

  return process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_URL || "";
}

export function withBasePath(path: string): string {
  const basePath = resolveBasePath();
  if (!path.startsWith("/")) return `${basePath}/${path}`;
  return `${basePath}${path}`;
}

/**
 * Valor constante para quem só precisa do prefixo (ex.: path de cookie).
 * Prefira `withBasePath()` em código de cliente: ele resolve na hora da chamada,
 * quando o DOM já existe.
 */
export const BASE_PATH = resolveBasePath();

export const apiUrl = withBasePath;

/** URL da imagem servida pelo bucket privado (R2) via route handler. */
export function mediaUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return withBasePath(`/api/media/${key}`);
}
