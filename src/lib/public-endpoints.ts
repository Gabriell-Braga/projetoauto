import { PORTALS, oauthCallbackPath } from "@/lib/integrations/portals";
import { withBasePath } from "@/lib/paths";

export type PublicEndpoint = {
  /** O que é. */
  label: string;
  /** Onde precisa estar cadastrado fora do app. */
  where: string;
  url: string;
};

/**
 * Todo endereço deste app que alguém DE FORA precisa conhecer.
 *
 * É a lista da troca de domínio: quando `APP_ORIGIN` muda, cada um destes
 * precisa ser recadastrado no serviço correspondente, senão o retorno do
 * OAuth cai no domínio antigo, o Asaas avisa um endereço que não existe mais
 * e a rotina diária chama o lugar errado. A tela de configurações do
 * super-admin mostra a lista pronta para copiar; o código nunca fixa domínio.
 */
export function publicEndpoints(origin: string): PublicEndpoint[] {
  const at = (path: string) => `${origin}${withBasePath(path)}`;

  const oauth = PORTALS.filter((portal) => portal.method === "oauth").map((portal) => ({
    label: `Retorno do OAuth — ${portal.name}`,
    where: `App do integrador no ${portal.name} (redirect URI)`,
    url: at(oauthCallbackPath(portal.key)),
  }));

  return [
    ...oauth,
    {
      label: "Notificações do Mercado Livre",
      where: "App do integrador no Mercado Livre (URL de callback de notificações)",
      url: at("/api/webhooks/mercadolivre"),
    },
    {
      label: "Webhook do Asaas",
      where: "Asaas → Integrações → Webhooks",
      url: at("/api/webhooks/asaas"),
    },
    {
      label: "Webhook do WhatsApp",
      where: "Meta for Developers → app do WhatsApp → Webhooks (por revenda; a tela de mensagens mostra o mesmo endereço)",
      url: at("/api/webhooks/whatsapp"),
    },
    {
      label: "Rotina diária (cobrança e faxina)",
      where: "GitHub → Settings → Variables → OPS_BASE_URL (sem o /api/ops)",
      url: at("/api/ops/billing"),
    },
    {
      label: "Sincronização dos portais",
      where: "Agendador externo, junto com a rotina diária",
      url: at("/api/ops/sync-portals"),
    },
    {
      label: "Leitura dos sites (app da Vercel)",
      where: "Vercel → Environment Variables → PANEL_URL (este endereço, sem o /api)",
      url: at("/api/public"),
    },
  ];
}
