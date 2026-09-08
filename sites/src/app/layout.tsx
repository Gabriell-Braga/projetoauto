import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { themeToCssVariables } from "@projetoauto/site-kit/contract";
import { GoogleTagManager } from "@projetoauto/site-kit/shared/gtm";
import { fetchSite } from "~/lib/panel";
import { currentSlug } from "~/lib/site";
import "./globals.css";

export const dynamic = "force-dynamic";

/**
 * O titulo e a descricao sao da REVENDA, nunca da plataforma.
 *
 * Quem chega neste dominio esta no site de uma loja de carros; qualquer
 * mencao a "ProjetoAuto" aqui apareceria na aba do navegador e no resultado
 * do Google do cliente.
 */
export async function generateMetadata(): Promise<Metadata> {
  const slug = await currentSlug();
  const { site } = await fetchSite(slug);

  const description =
    site.aboutText?.slice(0, 160) ??
    `Confira o estoque de seminovos da ${site.name}: fotos, ficha técnica e contato direto.`;

  return {
    title: { default: site.name, template: `%s · ${site.name}` },
    description,
    openGraph: {
      siteName: site.name,
      title: site.name,
      description,
      type: "website",
      locale: "pt_BR",
    },
    twitter: { card: "summary_large_image" },
  };
}

/*
 * `preload: false`: o site de uma revenda usa UMA fonte, e pre-carregar todas
 * gastaria banda do visitante em arquivo que a pagina nao referencia.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-dm-sans",
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const slug = await currentSlug();
  const { site, gtmCode, available } = await fetchSite(slug);

  return (
    <html lang="pt-BR" className={dmSans.variable}>
      <body style={themeToCssVariables(site.theme) as React.CSSProperties}>
        {/* GTM so carrega em site no ar — pagina de indisponibilidade nao dispara tag */}
        {available ? <GoogleTagManager containerId={gtmCode} /> : null}
        {children}
      </body>
    </html>
  );
}
