import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { FeatureLocked } from "@/components/admin/feature-locked";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { portalCards } from "@/lib/integrations/portal-apps";
import { isVaultConfigured } from "@/lib/security/vault";
import {
  listConnections,
  publicationProblems,
  publicationSummary,
  publishedListings,
} from "@/lib/services/portals";
import { PortalsPanel } from "./portals-panel";

export const metadata: Metadata = { title: "Portais" };
export const dynamic = "force-dynamic";

export default async function PortalsPage({
  searchParams,
}: {
  searchParams: Promise<{ portal?: string; conectado?: string; erro?: string }>;
}) {
  const { portal, conectado, erro } = await searchParams;
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

  const [connections, summary, problems, listings] = await Promise.all([
    listConnections(context.tenant.id),
    publicationSummary(context.tenant.id),
    publicationProblems(context.tenant.id),
    publishedListings(context.tenant.id),
  ]);

  return (
    <>
      <PageHeader
        title="Portais"
        description="Conecte a conta da loja uma vez. Depois, publicar e remover acontece por aqui."
      />
      <PortalsPanel
        portals={portalCards()}
        notice={portal && (conectado || erro) ? { portal, error: erro ?? null } : null}
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
        listings={listings.map((listing) => ({
          portal: listing.portal,
          vehicleId: listing.vehicleId,
          vehicle: `${listing.brand} ${listing.model} ${listing.yearModel}`,
          url: listing.url,
          note: listing.note,
        }))}
        problems={problems.map((problem) => ({
          portal: problem.portal,
          vehicleId: problem.vehicleId,
          vehicle: `${problem.brand} ${problem.model} ${problem.yearModel}`,
          error: problem.error ?? "Erro sem detalhe",
        }))}
      />
    </>
  );
}
