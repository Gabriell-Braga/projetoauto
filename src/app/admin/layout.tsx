import {
  BarChart3,
  Building2,
  Car,
  Handshake,
  KanbanSquare,
  LayoutDashboard,
  MessagesSquare,
  MessageSquareQuote,
  Palette,
  Plug,
  Users,
} from "lucide-react";
import { AppShell, type NavSection } from "@/components/layout/shell";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";
import { Alert } from "@/components/ui/alert";
import { requireTenantPage } from "@/lib/auth/guards";
import { ROLE_LABELS, can } from "@/lib/auth/rbac";

import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

const ICON = "h-3.5 w-3.5";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireTenantPage();

  const operation = [
    {
      href: "/admin",
      label: "Visão geral",
      icon: <LayoutDashboard className={ICON} />,
      exact: true,
    },
    ...(can(context.role, "vehicles:read")
      ? [{ href: "/admin/estoque", label: "Estoque", icon: <Car className={ICON} /> }]
      : []),
    ...(can(context.role, "leads:read")
      ? [
          { href: "/admin/leads", label: "Leads", icon: <MessagesSquare className={ICON} /> },
          { href: "/admin/funil", label: "Funil", icon: <KanbanSquare className={ICON} /> },
        ]
      : []),
    ...(can(context.role, "financings:read")
      ? [
          {
            href: "/admin/financiamentos",
            label: "Financiamentos",
            icon: <Handshake className={ICON} />,
          },
        ]
      : []),
    ...(can(context.role, "reports:read")
      ? [{ href: "/admin/relatorios", label: "Relatórios", icon: <BarChart3 className={ICON} /> }]
      : []),
  ];

  const settings = [
    ...(can(context.role, "site:read")
      ? [{ href: "/admin/site", label: "Site", icon: <Palette className={ICON} /> }]
      : []),
    ...(can(context.role, "leads:read")
      ? [
          {
            href: "/admin/mensagens",
            label: "Mensagens",
            icon: <MessageSquareQuote className={ICON} />,
          },
        ]
      : []),
    ...(can(context.role, "users:read")
      ? [{ href: "/admin/usuarios", label: "Usuários", icon: <Users className={ICON} /> }]
      : []),
    ...(can(context.role, "stores:write")
      ? [{ href: "/admin/unidades", label: "Unidades", icon: <Building2 className={ICON} /> }]
      : []),
    ...(can(context.role, "api:manage")
      ? [{ href: "/admin/integracoes", label: "API e webhooks", icon: <Plug className={ICON} /> }]
      : []),
  ];

  const sections: NavSection[] = [
    { items: operation },
    ...(settings.length > 0 ? [{ label: "Configuração", items: settings }] : []),
  ];

  const banner = (
    <>
      {context.impersonating ? <ImpersonationBanner tenantName={context.tenant.name} /> : null}
      {context.access === "readonly" ? (
        <div className="px-4 pt-4 sm:px-6">
          <Alert tone="warning">
            Assinatura com pendência financeira. O painel está em modo{" "}
            <strong className="font-medium">somente leitura</strong> e o site público está fora do
            ar. Fale com o suporte para regularizar.
          </Alert>
        </div>
      ) : null}
    </>
  );

  return (
    <AppShell
      contextLabel={context.tenant.name}
      homeHref="/admin"
      sections={sections}
      search={{ action: "/admin/estoque", placeholder: "Buscar no estoque" }}
      user={{
        name: context.user.name,
        email: context.user.email,
        roleLabel: ROLE_LABELS[context.role],
      }}
      banner={banner}
    >
      {children}
    </AppShell>
  );
}
