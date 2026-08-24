import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { THEME_COOKIE, isThemePreference, themeClassName } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Plataforma de Revendas",
    template: "%s · Plataforma de Revendas",
  },
  description: "Painel de gestão de estoque e sites para revendas de veículos.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // lido no servidor: a página já chega pintada no tema certo, sem FOUC
  const preference = (await cookies()).get(THEME_COOKIE)?.value;
  const themeClass = isThemePreference(preference) ? themeClassName(preference) : "";

  // O mount path pode só existir no runtime do Worker; publicamos no <html>
  // para o cliente montar URLs de fetch e de imagem sem depender do build.
  const basePath = process.env.BASE_URL ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <html
      lang="pt-BR"
      className={`${themeClass} ${inter.variable} ${spaceGrotesk.variable}`.trim()}
      data-base-path={basePath || undefined}
      suppressHydrationWarning
    >
      <body>
        {/* Avisos vivem no layout raiz: login, recuperação de senha e site
            público também precisam falar com quem está na tela. */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
