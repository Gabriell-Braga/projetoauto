import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { vehiclePublications } from "@/db/schema";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { getOrigin } from "@/lib/seo/urls";
import { syncTenantPortals } from "@/lib/services/portal-sync";

export const dynamic = "force-dynamic";

/**
 * Passada geral da fila dos portais, para o agendador.
 *
 * O caminho normal é a sincronização logo depois de salvar o veículo; este
 * endpoint recolhe o que ficou para trás (portal fora do ar na hora, erro
 * corrigido depois) e renova tokens de quem não mexe no estoque há horas.
 * Mesmo header `x-ops-secret` dos outros /api/ops.
 */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const db = await getDb();
  const pending = await db
    .selectDistinct({ tenantId: vehiclePublications.tenantId })
    .from(vehiclePublications)
    .where(inArray(vehiclePublications.status, ["pendente", "removendo", "erro"]));

  const origin = await getOrigin();
  const results = [];
  for (const { tenantId } of pending) {
    results.push({ tenantId, reports: await syncTenantPortals(tenantId, origin) });
  }
  return jsonOk({ tenants: results.length, results });
});
