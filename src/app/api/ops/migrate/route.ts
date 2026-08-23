import { runMigrations } from "@/db/migrate";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";

export const dynamic = "force-dynamic";

/** Aplica as migrations no banco do ambiente atual (local ou Webflow Cloud). */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);
  const report = await runMigrations();
  return jsonOk(report);
});
