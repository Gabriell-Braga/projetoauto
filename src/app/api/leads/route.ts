import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, vehicles, type VehicleStatus } from "@/db/schema";
import { badRequest, clientIp, jsonOk, notFound, tooManyRequests, withApi } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";
import { onlyDigits } from "@/lib/utils";
import { publicLeadSchema } from "@/lib/validation/leads";

export const dynamic = "force-dynamic";

const PUBLIC_STATUSES: VehicleStatus[] = ["available", "reserved"];

/** Endpoint público do formulário de contato dos sites das revendas. */
export const POST = withApi(async (request: Request) => {
  const parsed = publicLeadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  // honeypot preenchido: responde ok para não ensinar o bot
  if (input.website) return jsonOk({ received: true });

  const ip = clientIp(request) ?? "desconhecido";
  const byIp = await rateLimit(`lead:ip:${ip}`, 10, 3600);
  const byPhone = await rateLimit(`lead:phone:${onlyDigits(input.phone)}`, 5, 3600);
  if (!byIp.allowed || !byPhone.allowed) throw tooManyRequests();

  const tenant = await getTenantCoreBySlug(input.tenantSlug);
  if (!tenant || !isPublicSiteAvailable(tenant)) throw notFound("Site indisponível");

  const db = await getDb();
  let vehicleLabel: string | null = null;
  let vehicleId: string | null = null;

  if (input.vehicleId) {
    const found = await db
      .select({
        id: vehicles.id,
        brand: vehicles.brand,
        model: vehicles.model,
        version: vehicles.version,
        yearModel: vehicles.yearModel,
      })
      .from(vehicles)
      .where(
        and(
          eq(vehicles.tenantId, tenant.id),
          eq(vehicles.id, input.vehicleId),
          inArray(vehicles.status, PUBLIC_STATUSES),
        ),
      )
      .limit(1);

    if (found[0]) {
      vehicleId = found[0].id;
      vehicleLabel = [found[0].brand, found[0].model, found[0].version, found[0].yearModel]
        .filter(Boolean)
        .join(" ");
    }
  }

  const created = await db
    .insert(leads)
    .values({
      tenantId: tenant.id,
      vehicleId,
      vehicleLabel,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      message: input.message || null,
      source: "form",
      status: "new",
      utm: input.utm,
    })
    .returning({ id: leads.id });

  return jsonOk({ id: created[0].id, received: true });
});
