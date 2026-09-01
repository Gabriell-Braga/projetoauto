import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { platformSettings } from "@/db/schema";
import { logAuditFor } from "@/lib/audit";
import { requireApiSuperAdmin } from "@/lib/auth/guards";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { getPlatformSettings, invalidateSettings } from "@/lib/plans/service";
import { platformSettingsSchema } from "@/lib/validation/plans";

export const dynamic = "force-dynamic";

export const GET = withApi(async () => {
  await requireApiSuperAdmin("platform:billing:read");
  return jsonOk(await getPlatformSettings());
});

/**
 * Multa, juros e trial vivem aqui para mudarem sem deploy. A alteração vale
 * para as assinaturas criadas dali em diante — as que já existem no gateway
 * mantêm o que foi pactuado na contratação.
 */
export const PATCH = withApi(async (request: Request) => {
  const context = await requireApiSuperAdmin("platform:billing:write");

  const parsed = platformSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);

  const db = await getDb();
  const existing = await db
    .select({ id: platformSettings.id })
    .from(platformSettings)
    .where(eq(platformSettings.id, "default"))
    .limit(1);

  if (existing[0]) {
    await db.update(platformSettings).set(parsed.data).where(eq(platformSettings.id, "default"));
  } else {
    await db.insert(platformSettings).values({ id: "default", ...parsed.data });
  }

  await invalidateSettings();
  await logAuditFor(
    context,
    { action: "platform.settings.update", entity: "platform_settings", entityId: "default", metadata: parsed.data },
    request,
  );

  return jsonOk(parsed.data);
});
