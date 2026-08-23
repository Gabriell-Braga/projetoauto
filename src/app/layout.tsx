import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Plataforma de Revendas",
    template: "%s · Plataforma de Revendas",
  },
  description: "Painel de gestão de estoque e sites para revendas de veículos.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
