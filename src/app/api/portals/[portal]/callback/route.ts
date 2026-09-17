import { NextResponse } from "next/server";
import { logAuditFor } from "@/lib/audit";
import { requireApiTenant } from "@/lib/auth/guards";
import { ApiError } from "@/lib/http";
import { portalApp } from "@/lib/integrations/portal-apps";
import { exchangeCode, verifyOauthState } from "@/lib/integrations/portal-oauth";
import { getPortal } from "@/lib/integrations/portals";
import { withBasePath } from "@/lib/paths";
import { getOrigin } from "@/lib/seo/urls";
import { connectOauthPortal } from "@/lib/services/portals";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ portal: string }> };

/**
 * Para onde o portal manda a pessoa depois de autorizar.
 *
 * É esta URL (com o mount path na frente) que se cadastra no app do portal:
 *   https://<host>/app/api/portals/<portal>/callback
 *
 * Quem chega aqui é um navegador, não uma API — então erro não vira JSON:
 * volta para a tela de portais com a mensagem, que é onde a pessoa estava.
 *
 * Se o portal devolveu para um host que não é o do painel (o interno do
 * Webflow Cloud, por exemplo), não há sessão aqui: a mesma chamada é
 * reencaminhada para a origem que iniciou o fluxo, e lá ela se resolve.
 */
export async function GET(request: Request, { params }: Params) {
  const { portal: key } = await params;
  // a origem para voltar é a mesma que iniciou o fluxo (vem no estado); só
  // sem estado é que se recorre aos headers
  let origin = await getOrigin();
  const requestUrl = new URL(request.url);
  const back = (query: Record<string, string>) => {
    const url = new URL(withBasePath("/admin/portais"), origin);
    for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    return NextResponse.redirect(url);
  };

  const portal = getPortal(key);
  if (!portal || !portal.oauth) return back({ portal: key, erro: "Portal desconhecido." });

  try {
    const query = requestUrl.searchParams;
    const stateToken = query.get("state");
    const state = stateToken ? await verifyOauthState(stateToken) : null;
    if (!state || state.portal !== key) {
      throw new ApiError(400, "A autorização expirou ou não começou aqui. Tente conectar de novo.");
    }

    const expected = new URL(state.redirectUri);
    origin = expected.origin;
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host && host !== expected.host) {
      const forward = new URL(expected);
      forward.search = requestUrl.search;
      return NextResponse.redirect(forward);
    }

    // a sessão precisa ser a mesma revenda que começou: o cookie prova o
    // navegador, a sessão prova quem está nele
    const context = await requireApiTenant("tenant:settings");
    if (context.tenant.id !== state.tenantId) {
      throw new ApiError(403, "A autorização foi iniciada por outra revenda.");
    }

    if (query.get("error")) {
      const reason = query.get("error_description") ?? query.get("error") ?? "";
      throw new ApiError(400, `${portal.name} não autorizou o acesso. ${reason}`.trim());
    }
    const code = query.get("code");
    if (!code) throw new ApiError(400, `${portal.name} voltou sem o código de autorização.`);

    const app = portalApp(portal);
    if (!app) throw new ApiError(409, `${portal.name} ainda não está liberado para integração.`);

    const tokens = await exchangeCode(portal, app, state.redirectUri, code);
    await connectOauthPortal(context.tenant.id, context.user.id, key, tokens);

    await logAuditFor(
      context,
      { action: "portal.connect", entity: "portal_connection", entityId: key },
      request,
    );
    return back({ portal: key, conectado: "1" });
  } catch (error) {
    if (error instanceof ApiError) return back({ portal: key, erro: error.message });
    console.error("[portais] retorno OAuth falhou:", error);
    return back({ portal: key, erro: "Não consegui concluir a conexão. Tente de novo." });
  }
}
