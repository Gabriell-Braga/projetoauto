import type { NextConfig } from "next";
import { normalizePanelUrl } from "./src/lib/panel-url";

/**
 * Falha AQUI, no build, com o nome da variável — e não em produção, com
 * "fetch failed" em toda página. A normalização mora junto do resto do app
 * para o `rewrites()` e as chamadas de dados nunca discordarem sobre qual é o
 * endereço do painel.
 */
const panelUrl = normalizePanelUrl(process.env.PANEL_URL);

const nextConfig: NextConfig = {
  // o pacote dos templates é TypeScript cru, sem passo de build próprio
  transpilePackages: ["@projetoauto/site-kit"],

  /**
   * As fotos continuam no domínio da revenda.
   *
   * Elas moram no R2 e quem sabe servi-las é o painel. Apontar o `<img>`
   * direto para lá colocaria o endereço do painel no código-fonte do site do
   * cliente; o reescrito mantém tudo sob o domínio dele, e o Next resolve
   * isso na borda, sem acordar uma função por imagem.
   */
  async rewrites() {
    return [{ source: "/media/:path*", destination: `${panelUrl}/api/media/:path*` }];
  },
};

export default nextConfig;
