import { cookies } from "next/headers";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { isThemePreference, THEME_COOKIE } from "@/lib/theme";

export const dynamic = "force-dynamic";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Grava a preferência de tema.
 *
 * Quem escreve é o servidor, não o `document.cookie`. O cliente precisaria
 * adivinhar o caminho do cookie a partir do mount path — e esse valor é
 * exatamente o que o Webflow Cloud deixa vazio no bundle, então o cookie
 * acabava gravado num caminho que não voltava na requisição seguinte: trocar
 * para claro e recarregar caía de volta no tema do sistema.
 *
 * Sem sessão de propósito: a preferência é do navegador e vale também na tela
 * de login, antes de existir usuário.
 */
export const POST = withApi(async (request: Request) => {
  const body = (await request.json().catch(() => null)) as { preference?: unknown } | null;
  if (!isThemePreference(body?.preference)) throw badRequest("Tema inválido");

  (await cookies()).set(THEME_COOKIE, body.preference, {
    // raiz do domínio: a preferência acompanha a pessoa em qualquer tela
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
    httpOnly: false,
  });

  return jsonOk({ preference: body.preference });
});
