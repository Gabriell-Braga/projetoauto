import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { PORTALS } from "@/lib/integrations/portals";
import { isVaultConfigured } from "@/lib/security/vault";
import { listConnections, publicationSummary } from "@/lib/services/portals";
import { PortalsPanel } from "./portals-panel";

export const metadata: Metadata = { title: "Portais" };
export const dynamic = "force-dynamic";

export default async function PortalsPage() {
  const context = await requireTenantPage("vehicles:read");

  if (!(await tenantHasFeature(context.tenant.id, "integracao_classificados"))) {
    return (
      <>
        <PageHeader title="Portais" description="Publique seu estoque nos classificados." />
        <FeatureLocked
          title="Integração com classificados não está no plano desta revenda"
          description="Ela mantém o estoque publicado nos portais a partir daqui: o carro cadastrado sobe sozinho e o vendido sai sozinho."
        />
      </>
    );
  }

  const [connections, summary] = await Promise.all([
    listConnections(context.tenant.id),
    publicationSummary(context.tenant.id),
  ]);

  return (
    <>
      <PageHeader
        title="Portais"
        description="Conecte a conta da loja uma vez. Depois, publicar e remover acontece por aqui."
      />
      <PortalsPanel
        portals={PORTALS}
        vaultReady={isVaultConfigured()}
        canWrite={can(context.role, "tenant:settings")}
        tenantSlug={context.tenant.slug}
        connections={connections.map((connection) => ({
          portal: connection.portal,
          status: connection.status,
          hasCredentials: Boolean(connection.credentials),
          lastSyncAt: connection.lastSyncAt?.toISOString() ?? null,
          lastError: connection.lastError,
        }))}
        summary={summary}
      />
    </>
  );
}
