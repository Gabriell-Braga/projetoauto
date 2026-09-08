import type { NextConfig } from "next";

/**
 * O endereço do painel. É de onde vêm os dados e as fotos.
 *
 * Sem ele o app não tem o que renderizar, então falha AQUI, no build, com o
 * nome da variável — e não em produção, com "fetch failed" em toda página.
 */
const panelUrl = process.env.PANEL_URL;
if (!panelUrl) {
  throw new Error(
    "PANEL_URL não está definida. É o endereço do painel (ex.: https://painel.exemplo.com), " +
      "de onde este app lê os dados dos sites.",
  );
}

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
