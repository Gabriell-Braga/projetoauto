import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { requireTenantPage } from "@/lib/auth/guards";
import { assignableRoles, can } from "@/lib/auth/rbac";
import { listTenantUsers } from "@/lib/services/users";
import { TeamPanel } from "./team-panel";

export const metadata: Metadata = { title: "Usuários" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const context = await requireTenantPage("users:read");
  const members = await listTenantUsers(context.tenant.id);
  const canWrite = can(context.role, "users:write") && context.access === "full";

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Controle quem acessa o painel e o que cada pessoa pode fazer."
      />
      <TeamPanel
        canWrite={canWrite}
        currentUserId={context.claims.sub}
        assignableRoles={assignableRoles(context.role)}
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status,
          mustChangePassword: member.mustChangePassword,
          lastLoginAt: member.lastLoginAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
