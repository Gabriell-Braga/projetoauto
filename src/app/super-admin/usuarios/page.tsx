import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { listPlatformUsers } from "@/lib/services/users";
import { PlatformUsersPanel } from "./platform-users-panel";

export const metadata: Metadata = { title: "Usuários da plataforma" };
export const dynamic = "force-dynamic";

export default async function PlatformUsersPage() {
  const context = await requireSuperAdminPage();
  const users = await listPlatformUsers();

  return (
    <>
      <PageHeader
        title="Usuários da plataforma"
        description="Equipe interna com acesso ao Painel Geral."
      />
      <PlatformUsersPanel
        currentUserId={context.user.id}
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
