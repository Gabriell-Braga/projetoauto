import { runMigrations } from "@/db/migrate";
import { ApiError, jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";

export const dynamic = "force-dynamic";

/**
 * Aplica as migrations no banco do ambiente atual (local ou Webflow Cloud).
 * A rota é protegida por OPS_SECRET, então o erro real vai na resposta —
 * depurar migration às cegas por log de Worker é inviável.
 */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  try {
    const report = await runMigrations();
    return jsonOk(report);
  } catch (error) {
    throw new ApiError(500, "Falha ao aplicar migrations", {
      detalhe: error instanceof Error ? error.message : String(error),
    });
  }
});
