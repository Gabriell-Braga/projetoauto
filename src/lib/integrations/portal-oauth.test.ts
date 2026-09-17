import { afterEach, describe, expect, it, vi } from "vitest";
import { portalAvailability, portalApp } from "./portal-apps";
import { authorizeUrl, exchangeCode, signOauthState, verifyOauthState } from "./portal-oauth";
import { getPortal, oauthCallbackPath } from "./portals";

const olx = getPortal("olx")!;
const app = { clientId: "id-123", clientSecret: "segredo" };
const redirect = "https://projetoauto.webflow.io/app/api/portals/olx/callback";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("disponibilidade", () => {
  it("o portal só fica pronto quando o nosso app tem credenciais no ambiente", () => {
    expect(portalAvailability(olx)).toBe("aguardando_acesso");
    vi.stubEnv("OLX_CLIENT_ID", "id");
    vi.stubEnv("OLX_CLIENT_SECRET", "segredo");
    expect(portalAvailability(olx)).toBe("pronto");
    expect(portalApp(olx)).toEqual({ clientId: "id", clientSecret: "segredo" });
  });

  it("metade do par não conta", () => {
    vi.stubEnv("WEBMOTORS_CLIENT_ID", "id");
    expect(portalAvailability(getPortal("webmotors")!)).toBe("aguardando_acesso");
  });

  it("feed está sempre pronto; OAuth sem endereço nunca está", () => {
    expect(portalAvailability(getPortal("feed")!)).toBe("pronto");
    expect(portalAvailability(getPortal("icarros")!)).toBe("aguardando_acesso");
  });
});

describe("authorizeUrl", () => {
  it("monta a URL que o portal documenta, com o estado assinado no state", () => {
    const url = new URL(authorizeUrl(olx.oauth!, app, redirect, "estado-assinado"));
    expect(url.origin + url.pathname).toBe("https://auth.olx.com.br/oauth");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("id-123");
    expect(url.searchParams.get("redirect_uri")).toBe(redirect);
    expect(url.searchParams.get("scope")).toBe("basic_user_info autoupload");
    expect(url.searchParams.get("state")).toBe("estado-assinado");
  });

  it("o caminho de retorno é fixo por portal — é o que se cadastra lá", () => {
    expect(oauthCallbackPath("olx")).toBe("/api/portals/olx/callback");
  });
});

describe("estado assinado", () => {
  it("volta igual quando a assinatura confere", async () => {
    const state = { portal: "olx", tenantId: "t1", redirectUri: redirect };
    expect(await verifyOauthState(await signOauthState(state))).toEqual(state);
  });

  it("recusa token adulterado", async () => {
    const token = await signOauthState({ portal: "olx", tenantId: "t1", redirectUri: redirect });
    expect(await verifyOauthState(token.slice(0, -2) + "xx")).toBeNull();
  });
});

describe("exchangeCode", () => {
  function fetcherReturning(status: number, body: unknown) {
    const fetcher = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    return fetcher as unknown as typeof fetch & { mock: { calls: [string, RequestInit][] } };
  }

  it("manda form-urlencoded com o que o portal espera", async () => {
    const fetcher = fetcherReturning(200, { access_token: "tok", token_type: "Bearer" });
    const tokens = await exchangeCode(olx, app, redirect, "code-1", fetcher);

    expect(tokens).toEqual({ accessToken: "tok" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://auth.olx.com.br/oauth/token");
    expect((init.headers as Record<string, string>)["content-type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    const body = init.body as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("client_secret")).toBe("segredo");
    expect(body.get("code")).toBe("code-1");
    expect(body.get("redirect_uri")).toBe(redirect);
  });

  it("guarda refresh, validade e conta quando o portal devolve (Mercado Livre)", async () => {
    const fetcher = fetcherReturning(200, {
      access_token: "tok",
      refresh_token: "ref",
      expires_in: 21600,
      user_id: 987,
    });
    const before = Date.now();
    const tokens = await exchangeCode(getPortal("mercadolivre")!, app, redirect, "c", fetcher);

    expect(tokens.refreshToken).toBe("ref");
    expect(tokens.externalUserId).toBe("987");
    const expiresAt = Date.parse(tokens.expiresAt!);
    expect(expiresAt).toBeGreaterThanOrEqual(before + 21600 * 1000);
  });

  it("erro do portal vira mensagem legível, não 500", async () => {
    const fetcher = fetcherReturning(400, { error: "invalid_grant" });
    await expect(exchangeCode(olx, app, redirect, "c", fetcher)).rejects.toMatchObject({
      status: 502,
      message: "OLX Autos não aceitou a autorização: invalid_grant",
    });
  });
});
