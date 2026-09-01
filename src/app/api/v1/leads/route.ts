import { and, desc, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { requireApiKey } from "@/lib/api/key-auth";
import { badRequest, jsonOk, withApi } from "@/lib/http";
import { dispatchTenantEvent } from "@/lib/services/api-access";
import { listStages, pickAssignee, recordLeadEvent } from "@/lib/services/crm";
import { onlyDigits } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MAX_PAGE = 200;

/** Leads da revenda. `desde` aceita data ISO para sincronização incremental. */
export const GET = withApi(async (request: Request) => {
  const { tenantId } = await requireApiKey(request);

  const query = new URL(request.url).searchParams;
  const limit = Math.min(Number(query.get("limite")) || 50, MAX_PAGE);
  const since = query.get("desde");

  const conditions = [eq(leads.tenantId, tenantId)];
  if (since) {
    const date = new Date(since);
    if (Number.isNaN(date.getTime())) throw badRequest("Parâmetro 'desde' não é uma data válida");
    conditions.push(gte(leads.createdAt, date));
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(limit);

  return jsonOk({
    leads: rows.map((lead) => ({
      id: lead.id,
      nome: lead.name,
      telefone: lead.phone,
      email: lead.email,
      mensagem: lead.message,
      veiculo: lead.vehicleLabel,
      origem: lead.source,
      situacao: lead.status,
      criadoEm: lead.createdAt.toISOString(),
    })),
  });
});

const createSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z
    .string()
    .trim()
    .refine((value) => onlyDigits(value).length >= 10, "Telefone precisa ter DDD"),
  email: z.string().trim().email().optional().or(z.literal("")),
  mensagem: z.string().trim().max(2000).optional(),
  origem: z.enum(["form", "whatsapp", "phone", "manual"]).optional(),
});

/** Entrada de lead vindo de fora — portal, landing page, telefonia. */
export const POST = withApi(async (request: Request) => {
  const { tenantId } = await requireApiKey(request);

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw badRequest("Dados inválidos", parsed.error.issues);
  const input = parsed.data;

  const stages = await listStages(tenantId);
  const firstStage = stages.find((stage) => stage.kind === "open") ?? stages[0] ?? null;

  const db = await getDb();
  const created = await db
    .insert(leads)
    .values({
      tenantId,
      name: input.nome,
      phone: input.telefone,
      email: input.email || null,
      message: input.mensagem || null,
      source: input.origem ?? "manual",
      status: "new",
      stageId: firstStage?.id ?? null,
      assignedToUserId: await pickAssignee(tenantId, null),
    })
    .returning({ id: leads.id });

  await recordLeadEvent({
    tenantId,
    leadId: created[0].id,
    type: "created",
    body: "Lead recebido pela API.",
    metadata: { origem: input.origem ?? "manual" },
  });

  await dispatchTenantEvent(tenantId, "lead.created", {
    id: created[0].id,
    name: input.nome,
    phone: input.telefone,
    source: input.origem ?? "manual",
  });

  return jsonOk({ id: created[0].id });
});
