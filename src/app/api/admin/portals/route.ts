import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { jsonOk, withApi } from "@/lib/http";
import { isVaultConfigured } from "@/lib/security/vault";
import { listConnections, publicationSummary } from "@/lib/services/portals";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  const context = await requireApiTenant("vehicles:read");
  await requireFeature(context.tenant.id, "integracao_classificados");

  const connections = await listConnections(context.tenant.id);

  return jsonOk({
    cofreConfigurado: isVaultConfigured(),
    // as credenciais nunca voltam: a tela só precisa saber se existem
    conexoes: connections.map((connection) => ({
      portal: connection.portal,
      status: connection.status,
      temCredenciais: Boolean(connection.credentials),
      ultimaSincronizacao: connection.lastSyncAt,
      ultimoErro: connection.lastError,
    })),
    publicacoes: await publicationSummary(context.tenant.id),
  });
});
