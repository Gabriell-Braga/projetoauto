import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { getVehicleStats } from "@/lib/services/vehicles";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";
import { formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel da revenda" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const context = await requireTenantPage();
  const stats = can(context.role, "vehicles:read")
    ? await getVehicleStats(context.tenant.id)
    : null;

  return (
    <>
      <PageHeader
        title={`Olá, ${context.user.name.split(" ")[0]}`}
        description="Acompanhe o estoque e os contatos recebidos pelo seu site."
        actions={
          <Link href={tenantPublicPath(context.tenant.slug)} target="_blank">
            <Button variant="secondary">Ver meu site</Button>
          </Link>
        }
      />

      {stats ? (
        <StatGrid>
          <StatCard label="Veículos disponíveis" value={formatNumber(stats.available)} tone="success" />
          <StatCard label="Reservados" value={formatNumber(stats.reserved)} tone="warning" />
          <StatCard label="Vendidos" value={formatNumber(stats.sold)} />
          <StatCard
            label="Rascunhos"
            value={formatNumber(stats.draft)}
            hint="Ainda não aparecem no site"
          />
          <StatCard label="Em destaque" value={formatNumber(stats.featured)} />
        </StatGrid>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seu site</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-600">
              Endereço público:{" "}
              <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">
                {tenantPublicPath(context.tenant.slug)}
              </code>
            </p>
            <p className="mt-3 text-sm text-ink-500">
              As configurações visuais e os textos do site ficam na seção Site.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos passos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-ink-600">
              <li>1. Cadastre os veículos com fotos de boa qualidade.</li>
              <li>2. Marque os melhores como destaque para aparecerem na home.</li>
              <li>3. Personalize os dados de contato e o WhatsApp na seção Site.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
