import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { sessionSecretKey } from "@/lib/auth/session";
import { ApiError, badRequest } from "@/lib/http";
import type { PortalApp } from "./portal-apps";
import type { PortalDefinition, PortalOauth } from "./portals";

/**
 * Fluxo OAuth 2.0 (authorization code) com os portais.
 *
 * O portal precisa conhecer a URL de retorno de antemão — ela é cadastrada
 * junto com o nosso app lá. Por isso o caminho é fixo por portal
 * (`oauthCallbackPath`) e a origem vem do request, não de configuração.
 */

export const OAUTH_STATE_COOKIE = "pa_portal_oauth";
export const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export type OauthState = {
  portal: string;
  tenantId: string;
  nonce: string;
};

/**
 * O estado vai assinado no cookie e o nonce vai na URL de autorização.
 * Quem volta com um `state` que não bate com o cookie não começou o fluxo
 * neste navegador — é CSRF, e o retorno é recusado.
 */
export async function signOauthState(state: OauthState): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ portal: state.portal, tenantId: state.tenantId, nonce: state.nonce })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + OAUTH_STATE_TTL_SECONDS)
    .sign(sessionSecretKey());
}

export async function verifyOauthState(token: string): Promise<OauthState | null> {
  try {
    const { payload } = await jwtVerify(token, sessionSecretKey(), { algorithms: ["HS256"] });
    if (
      typeof payload.portal !== "string" ||
      typeof payload.tenantId !== "string" ||
      typeof payload.nonce !== "string"
    ) {
      return null;
    }
    return { portal: payload.portal, tenantId: payload.tenantId, nonce: payload.nonce };
  } catch {
    return null;
  }
}

export function authorizeUrl(
  oauth: PortalOauth,
  app: PortalApp,
  redirectUri: string,
  nonce: string,
): string {
  const url = new URL(oauth.authorizeUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", app.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  if (oauth.scope) url.searchParams.set("scope", oauth.scope);
  url.searchParams.set("state", nonce);
  return url.toString();
}

/** O que guardamos no cofre depois da autorização. Tudo string: é JSON cifrado. */
export type OauthTokens = {
  accessToken: string;
  refreshToken?: string;
  /** ISO. Ausente quando o portal não expira o token (OLX). */
  expiresAt?: string;
  /** Id da conta no portal, quando ele devolve (Mercado Livre manda `user_id`). */
  externalUserId?: string;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user_id?: number | string;
  error?: string;
  error_description?: string;
  message?: string;
};

/**
 * Troca o código pelo token. Form-urlencoded porque é o que OLX e Mercado
 * Livre documentam — e o JSON no lugar dele é a causa clássica de 400 aqui.
 */
export async function exchangeCode(
  portal: PortalDefinition,
  app: PortalApp,
  redirectUri: string,
  code: string,
  fetcher: typeof fetch = fetch,
): Promise<OauthTokens> {
  if (!portal.oauth) throw badRequest(`${portal.name} não conecta por OAuth`);

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: app.clientId,
    client_secret: app.clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetcher(portal.oauth.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as TokenResponse;
  if (!response.ok || !payload.access_token) {
    const reason = payload.error_description ?? payload.message ?? payload.error ?? `HTTP ${response.status}`;
    throw new ApiError(502, `${portal.name} não aceitou a autorização: ${reason}`);
  }

  const tokens: OauthTokens = { accessToken: payload.access_token };
  if (payload.refresh_token) tokens.refreshToken = payload.refresh_token;
  if (typeof payload.expires_in === "number") {
    tokens.expiresAt = new Date(Date.now() + payload.expires_in * 1000).toISOString();
  }
  if (payload.user_id !== undefined) tokens.externalUserId = String(payload.user_id);
  return tokens;
}
