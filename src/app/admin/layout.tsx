import { Car, LayoutDashboard, MessagesSquare, Palette, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/shell";
import { Alert } from "@/components/ui/alert";
import { requireTenantPage } from "@/lib/auth/guards";
import { ROLE_LABELS, can } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireTenantPage();

  const nav: NavItem[] = [
    { href: "/admin", label: "Visão geral", icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
    ...(can(context.role, "vehicles:read")
      ? [{ href: "/admin/estoque", label: "Estoque", icon: <Car className="h-4 w-4" /> }]
      : []),
    ...(can(context.role, "leads:read")
      ? [{ href: "/admin/leads", label: "Leads", icon: <MessagesSquare className="h-4 w-4" /> }]
      : []),
    ...(can(context.role, "site:read")
      ? [{ href: "/admin/site", label: "Site", icon: <Palette className="h-4 w-4" /> }]
      : []),
    ...(can(context.role, "users:read")
      ? [{ href: "/admin/usuarios", label: "Usuários", icon: <Users className="h-4 w-4" /> }]
      : []),
  ];

  const banner =
    context.access === "readonly" ? (
      <div className="px-4 pt-4 md:px-8">
        <Alert tone="warning">
          Sua assinatura está com pendência financeira. O painel está em modo{" "}
          <strong>somente leitura</strong> e o site público está indisponível. Entre em contato com o
          suporte para regularizar.
        </Alert>
      </div>
    ) : null;

  return (
    <AppShell
      brandLabel={context.tenant.name}
      brandHref="/admin"
      subtitle="Painel da revenda"
      nav={nav}
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
