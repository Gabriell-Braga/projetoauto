import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  portalConnections,
  vehiclePublications,
  vehicles,
  type PortalConnection,
} from "@/db/schema";
import { badRequest, conflict } from "@/lib/http";
import {
  getPortal,
  shouldBePublished,
  type PublicationStatus,
} from "@/lib/integrations/portals";
import { open, seal } from "@/lib/security/vault";

export async function listConnections(tenantId: string): Promise<PortalConnection[]> {
  const db = await getDb();
  return db
    .select()
    .from(portalConnections)
    .where(eq(portalConnections.tenantId, tenantId));
}

export async function getConnection(
  tenantId: string,
  portal: string,
): Promise<PortalConnection | null> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(portalConnections)
    .where(and(eq(portalConnections.tenantId, tenantId), eq(portalConnections.portal, portal)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Liga a conta da revenda ao portal.
 *
 * As credenciais vão para o cofre antes de encostar no banco. Se o cofre não
 * estiver configurado, a operação falha aqui — nunca grava em claro para
 * "resolver depois".
 */
export async function connectPortal(
  tenantId: string,
  userId: string | null,
  portal: string,
  credentials: Record<string, string>,
): Promise<void> {
  const definition = getPortal(portal);
  if (!definition) throw badRequest("Portal desconhecido");
  if (definition.method === "feed") {
    throw badRequest("Este portal usa o feed de estoque; não há conta para conectar.");
  }

  const missing = definition.fields
    .filter((field) => !credentials[field.key]?.trim())
    .map((field) => field.label);
  if (missing.length > 0) throw badRequest(`Faltou preencher: ${missing.join(", ")}`);

  const sealed = await seal(JSON.stringify(credentials));
  const db = await getDb();
  const existing = await getConnection(tenantId, portal);

  const values = {
    credentials: sealed,
    status: "conectado" as const,
    connectedByUserId: userId,
    lastError: null,
  };

  if (existing) {
    await db
      .update(portalConnections)
      .set(values)
      .where(eq(portalConnections.id, existing.id));
    return;
  }
  await db.insert(portalConnections).values({ tenantId, portal, ...values });
}

/**
 * Desliga e apaga as credenciais.
 *
 * As publicações ficam marcadas para remoção em vez de sumirem: os anúncios
 * continuam no ar no portal, e apagar o registro aqui deixaria a revenda sem
 * saber o que ainda está publicado por lá.
 */
export async function disconnectPortal(tenantId: string, portal: string): Promise<void> {
  const db = await getDb();
  const existing = await getConnection(tenantId, portal);
  if (!existing) throw badRequest("Portal não está conectado");

  await db
    .update(portalConnections)
    .set({ credentials: null, status: "desconectado", lastError: null })
    .where(eq(portalConnections.id, existing.id));

  await db
    .update(vehiclePublications)
    .set({ status: "removendo" })
    .where(
      and(
        eq(vehiclePublications.tenantId, tenantId),
        eq(vehiclePublications.portal, portal),
        inArray(vehiclePublications.status, ["publicado", "pendente"]),
      ),
    );
}

/** Credenciais decifradas, para o adaptador do portal usar. */
export async function readCredentials(
  connection: PortalConnection,
): Promise<Record<string, string>> {
  if (!connection.credentials) throw conflict("Portal sem credenciais guardadas");
  return JSON.parse(await open(connection.credentials)) as Record<string, string>;
}

/* ------------------------------------------------------------------------ */
/* Publicações                                                               */
/* ------------------------------------------------------------------------ */

export async function listPublications(tenantId: string, vehicleId?: string) {
  const db = await getDb();
  const where = vehicleId
    ? and(
        eq(vehiclePublications.tenantId, tenantId),
        eq(vehiclePublications.vehicleId, vehicleId),
      )
    : eq(vehiclePublications.tenantId, tenantId);
  return db.select().from(vehiclePublications).where(where);
}

/**
 * Põe o veículo na fila de cada portal conectado.
 *
 * Chamada quando o carro muda aqui. Não fala com portal nenhum: só registra o
 * que precisa acontecer. Assim, salvar um veículo nunca fica lento nem falha
 * por causa de um portal fora do ar — quem entrega é a sincronização.
 */
export async function queueVehicleSync(tenantId: string, vehicleId: string): Promise<void> {
  const db = await getDb();

  const vehicleRows = await db
    .select({ status: vehicles.status })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.id, vehicleId)))
    .limit(1);
  const vehicle = vehicleRows[0];
  if (!vehicle) return;

  const connections = (await listConnections(tenantId)).filter(
    (connection) => connection.status === "conectado",
  );
  if (connections.length === 0) return;

  const target: PublicationStatus = shouldBePublished(vehicle.status) ? "pendente" : "removendo";
  const existing = await listPublications(tenantId, vehicleId);

  for (const connection of connections) {
    const current = existing.find((row) => row.portal === connection.portal);

    if (!current) {
      // nunca publicado e já saindo de circulação: não há o que remover
      if (target === "removendo") continue;
      await db.insert(vehiclePublications).values({
        tenantId,
        vehicleId,
        portal: connection.portal,
        status: "pendente",
      });
      continue;
    }

    // já removido continua removido; reenfileirar criaria remoção infinita
    if (current.status === "removido" && target === "removendo") continue;

    await db
      .update(vehiclePublications)
      .set({ status: target, lastError: null })
      .where(eq(vehiclePublications.id, current.id));
  }
}

/** Resumo por portal, para a tela dizer o que está no ar e o que travou. */
export async function publicationSummary(tenantId: string) {
  const rows = await listPublications(tenantId);
  const byPortal = new Map<string, Record<PublicationStatus, number>>();

  for (const row of rows) {
    const current =
      byPortal.get(row.portal) ??
      { pendente: 0, publicado: 0, removendo: 0, removido: 0, erro: 0 };
    current[row.status] += 1;
    byPortal.set(row.portal, current);
  }

  return [...byPortal.entries()].map(([portal, counts]) => ({ portal, ...counts }));
}
