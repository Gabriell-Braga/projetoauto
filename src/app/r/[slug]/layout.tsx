import { notFound } from "next/navigation";
import { DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { getSiteData } from "@/lib/services/site";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";
import { getOrigin, tenantAbsoluteUrl } from "@/lib/seo/urls";
import { themeToCssVariables } from "@/templates/contract";
import { GoogleTagManager } from "@/templates/shared/gtm";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteData(slug);
  if (!site) return { title: "Site indisponível" };

  const [url, origin] = await Promise.all([tenantAbsoluteUrl(slug), getOrigin()]);
  const description =
    site.aboutText?.slice(0, 160) ??
    `Confira o estoque de seminovos da ${site.name}: fotos, ficha técnica e contato direto.`;

  return {
    // sem isso o Next resolve URLs relativas (og:image) contra localhost
    metadataBase: new URL(origin),
    title: { default: site.name, template: `%s · ${site.name}` },
    description,
    alternates: { canonical: url },
    openGraph: {
      siteName: site.name,
      title: site.name,
      description,
      url,
      type: "website",
      locale: "pt_BR",
    },
    twitter: { card: "summary_large_image" },
  };
}

/**
 * Fontes dos templates desenhados no Figma.
 *
 * `preload: false` de propósito: o site de uma revenda usa UMA delas, e
 * pré-carregar todas gastaria banda de visitante em arquivo que a página não
 * vai referenciar. Sem preload o navegador baixa só a que o CSS pedir.
 *
 * A variável entra sempre; quem decide se ela é usada é o tema do template,
 * que aponta `fontHeading` para ela.
 */
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-dm-sans",
});

export default async function PublicSiteLayout({ children, params }: Props) {
  const { slug } = await params;

  const tenant = await getTenantCoreBySlug(slug);
  if (!tenant) notFound();

  const site = await getSiteData(slug);
  const cssVariables = site ? themeToCssVariables(site.theme) : {};
  const available = isPublicSiteAvailable(tenant);

  return (
    <div className={dmSans.variable} style={cssVariables as React.CSSProperties}>
      {/* GTM só carrega em site no ar — página de indisponibilidade não dispara tag */}
      {available ? <GoogleTagManager containerId={site?.gtmCode ?? null} /> : null}
      {children}
    </div>
  );
}
