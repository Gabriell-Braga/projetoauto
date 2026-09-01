import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { vehicles } from "@/db/schema";
import { requireApiTenant } from "@/lib/auth/guards";
import { jsonOk, notFound, withApi } from "@/lib/http";
import { DRAFT_TTL_MS } from "@/lib/services/draft-cleanup";

export const dynamic = "force-dynamic";

/**
 * Abre um rascunho provisório para as fotos terem onde morar.
 *
 * As fotos precisam de um id de veículo — vão para o R2 numa chave que o
 * contém. Sem isto, cadastrar foto exigia salvar a ficha antes, e a pessoa
 * saía da tela no meio.
 *
 * Só nasce quando a primeira foto é enviada, nunca ao abrir a tela: quem só
 * espia o formulário não deixa rastro. Não conta no limite do plano, que olha
 * apenas veículos disponíveis e reservados.
 */
export const POST = withApi(async () => {
  const context = await requireApiTenant("vehicles:write");
  const db = await getDb();

  const created = await db
    .insert(vehicles)
    .values({
      tenantId: context.tenant.id,
      // placeholders: as colunas são obrigatórias e a ficha ainda não existe.
      // O slug leva o id para não colidir com outro rascunho da mesma revenda.
      brand: "",
      model: "",
      slug: `rascunho-${crypto.randomUUID()}`,
      yearManufacture: 0,
      yearModel: 0,
      status: "draft",
      draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS),
    })
    .returning({ id: vehicles.id });

  return jsonOk({ id: created[0].id });
});

/**
 * Renova a validade do rascunho.
 *
 * Cadastro longo — muitas fotos, pessoa interrompida — não pode ser varrido
 * embaixo de quem ainda está preenchendo.
 */
export const PATCH = withApi(async (request: Request) => {
  const context = await requireApiTenant("vehicles:write");

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) throw notFound("Rascunho não informado");

  const db = await getDb();
  // tenantId no WHERE, não numa conferência depois: filtrar após o UPDATE
  // significaria ter escrito na linha de outra revenda antes de descobrir
  const updated = await db
    .update(vehicles)
    .set({ draftExpiresAt: new Date(Date.now() + DRAFT_TTL_MS) })
    .where(and(eq(vehicles.id, body.id), eq(vehicles.tenantId, context.tenant.id)))
    .returning({ id: vehicles.id });

  if (!updated[0]) throw notFound("Rascunho não encontrado");

  return jsonOk({ id: updated[0].id });
});
