import { Building2, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/shell";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

const NAV: NavItem[] = [
  { href: "/super-admin", label: "Visão geral", icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
  { href: "/super-admin/revendas", label: "Revendas", icon: <Building2 className="h-4 w-4" /> },
  { href: "/super-admin/usuarios", label: "Usuários", icon: <Users className="h-4 w-4" /> },
  { href: "/super-admin/auditoria", label: "Auditoria", icon: <ScrollText className="h-4 w-4" /> },
];

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const context = await requireSuperAdminPage();

  return (
    <AppShell
      brandLabel="Painel Geral"
      brandHref="/super-admin"
      subtitle="Administração da plataforma"
      nav={NAV}
      user={{
        name: context.user.name,
        email: context.user.email,
        roleLabel: ROLE_LABELS[context.role],
      }}
    >
      {children}
    </AppShell>
  );
}
