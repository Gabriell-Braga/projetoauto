import { panelUrl } from "~/lib/panel-url";

export const dynamic = "force-dynamic";

/**
 * Repasse dos formulários para o painel.
 *
 * Os formulários são os MESMOS componentes do painel, e eles enviam para
 * `/api/leads` do próprio site. Aqui esse endereço é o domínio da revenda, não
 * o do painel — sem este repasse, todo envio daria 404.
 *
 * Fazer o formulário chamar o painel direto exigiria CORS e colocaria o
 * endereço da plataforma dentro do código-fonte do site do cliente. Passando
 * por aqui, o navegador só conversa com o domínio da loja.
 */
export async function POST(request: Request) {
  const sitesKey = process.env.SITES_API_KEY ?? "";

  const response = await fetch(`${panelUrl()}/api/leads`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(sitesKey ? { "x-sites-key": sitesKey } : {}),
      /*
       * O IP de quem enviou.
       *
       * Sem ele o painel veria todos os leads chegando dos endereços da
       * Vercel, e qualquer limite por origem cairia sobre o tráfego legítimo
       * de todas as revendas de uma vez.
       */
      ...(request.headers.get("x-forwarded-for")
        ? { "x-forwarded-for": request.headers.get("x-forwarded-for")! }
        : {}),
    },
    body: await request.text(),
  });

  // a resposta do painel passa inteira: o formulário sabe ler os erros dele
  return new Response(await response.text(), {
    status: response.status,
    headers: { "content-type": "application/json" },
  });
}
