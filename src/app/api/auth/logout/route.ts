import { logAuditFor } from "@/lib/audit";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getAuthContext } from "@/lib/auth/guards";
import { jsonOk, withApi } from "@/lib/http";

export const dynamic = "force-dynamic";

export const POST = withApi(async (request: Request) => {
  const context = await getAuthContext();
  if (context) {
    await logAuditFor(context, { action: "auth.logout", entity: "user", entityId: context.user.id }, request);
  }
  await clearSessionCookie();
  return jsonOk({ redirectTo: "/login" });
});
