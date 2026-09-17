import { cookies } from "next/headers";
import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { badRequest, conflict, jsonOk, withApi } from "@/lib/http";
import { portalApp } from "@/lib/integrations/portal-apps";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_TTL_SECONDS,
  authorizeUrl,
  signOauthState,
} from "@/lib/integrations/portal-oauth";
import { getPortal, oauthCallbackPath } from "@/lib/integrations/portals";
import { withBasePath } from "@/lib/paths";
import { isVaultConfigured } from "@/lib/security/vault";
import { getOrigin } from "@/lib/seo/urls";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ portal: string }> };

/**
 * Começa a autorização: devolve a URL do portal para a tela redirecionar.
 *
 * É POST com resposta JSON, e não um redirect direto, para a tela conseguir
 * mostrar o erro (portal não liberado, cofre desligado) em vez de despejar a
 * pessoa numa página de JSON.
 */
export const POST = withApi(async (request: Request, { params }: Params) => {
  const context = await requireApiTenant("tenant:settings");
  await requireFeature(context.tenant.id, "integracao_classificados");
  const { portal: key } = await params;

  const portal = getPortal(key);
  if (!portal || portal.method !== "oauth" || !portal.oauth) {
    throw badRequest("Este portal não conecta por autorização.");
  }
  const app = portalApp(portal);
  if (!app) throw conflict(`${portal.name} ainda não está liberado para integração.`);
  if (!isVaultConfigured()) throw conflict("Cofre de credenciais não configurado.");

  // a redirect_uri precisa ser a que está cadastrada no app do portal: a
  // origem pública. Sem APP_ORIGIN, o header Origin do fetch do navegador é a
  // fonte mais confiável — ele traz o host que a pessoa está vendo
  const origin = process.env.APP_ORIGIN
    ? await getOrigin()
    : (request.headers.get("origin") ?? (await getOrigin()));
  const redirectUri = `${origin}${withBasePath(oauthCallbackPath(key))}`;

  const nonce = crypto.randomUUID();
  const state = await signOauthState({
    portal: key,
    tenantId: context.tenant.id,
    nonce,
    redirectUri,
  });

  const store = await cookies();
  store.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: withBasePath(oauthCallbackPath(key)),
    maxAge: OAUTH_STATE_TTL_SECONDS,
  });

  return jsonOk({ url: authorizeUrl(portal.oauth, app, redirectUri, nonce) });
});
