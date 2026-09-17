import { requireApiTenant } from "@/lib/auth/guards";
import { requireFeature } from "@/lib/api/feature-guard";
import { jsonOk, withApi } from "@/lib/http";
import { getOrigin } from "@/lib/seo/urls";
import { syncTenantPortals } from "@/lib/services/portal-sync";

export const dynamic = "force-dynamic";

/**
 * "Sincronizar agora": roda a fila e espera, para a tela mostrar o que
 * aconteceu. É o caminho de quem acabou de corrigir a ficha e quer ver o
 * erro sumir sem esperar o agendador.
 */
export const POST = withApi(async () => {
  const context = await requireApiTenant("vehicles:write");
  await requireFeature(context.tenant.id, "integracao_classificados");

  const reports = await syncTenantPortals(context.tenant.id, await getOrigin());
  return jsonOk({ reports });
});
