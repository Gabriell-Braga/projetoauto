import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { Card, CardContent } from "@/components/ui/card";
import { requireTenantPage } from "@/lib/auth/guards";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";

export const metadata: Metadata = { title: "Painel da revenda" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const context = await requireTenantPage();

  return (
    <>
      <PageHeader
        title={`Olá, ${context.user.name.split(" ")[0]}`}
        description="Gerencie o estoque, os leads e o site da sua revenda."
      />
      <Card>
        <CardContent>
          <p className="text-sm text-ink-600">
            Endereço do seu site:{" "}
            <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
              {tenantPublicPath(context.tenant.slug)}
            </code>
          </p>
          <p className="mt-3 text-sm text-ink-500">
            Estoque, leads e configurações do site entram nas próximas fases.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
