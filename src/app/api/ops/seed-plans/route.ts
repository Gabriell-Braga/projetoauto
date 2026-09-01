import { getDb } from "@/db";
import { plans, platformSettings } from "@/db/schema";
import { jsonOk, withApi } from "@/lib/http";
import { assertOpsSecret } from "@/lib/ops";
import { SEED_PLANS } from "@/lib/plans/seed";
import { invalidatePlanCaches, invalidateSettings } from "@/lib/plans/service";

export const dynamic = "force-dynamic";

/**
 * Cria a grade inicial de planos e a linha de configurações.
 * Idempotente: plano com slug já existente é preservado — depois de semeado,
 * quem manda é o CMS do Painel Geral, não este arquivo.
 */
export const POST = withApi(async (request: Request) => {
  assertOpsSecret(request);

  const db = await getDb();

  const existing = await db.select({ slug: plans.slug }).from(plans);
  const known = new Set(existing.map((row) => row.slug));

  const created: string[] = [];
  for (const plan of SEED_PLANS) {
    if (known.has(plan.slug)) continue;
    await db.insert(plans).values(plan);
    created.push(plan.slug);
  }

  const settings = await db.select({ id: platformSettings.id }).from(platformSettings).limit(1);
  let settingsCreated = false;
  if (!settings[0]) {
    await db.insert(platformSettings).values({ id: "default" });
    settingsCreated = true;
  }

  await invalidatePlanCaches();
  await invalidateSettings();

  return jsonOk({
    plansCreated: created,
    plansSkipped: [...known],
    settingsCreated,
  });
});
