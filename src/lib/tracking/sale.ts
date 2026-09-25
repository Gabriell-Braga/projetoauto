import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, vehicles, type Lead } from "@/db/schema";
import { trackInBackground } from "./dispatch";

/**
 * O sinal de venda.
 *
 * É o evento que fecha a conta da mídia: sem ele, a revenda sabe quanto
 * gastou e quantos leads entraram, mas nunca quais viraram carro vendido — e
 * o algoritmo da Meta e do Google continua otimizando por lead, não por
 * venda. Por isso o sinal sai do painel, dias depois do clique, e não do
 * navegador de ninguém.
 *
 * Duas coisas disparam venda, e as duas passam por aqui para não contarem a
 * mesma venda duas vezes:
 *
 * - **Lead ganho.** É o melhor sinal: leva e-mail e telefone de quem comprou,
 *   que é o que permite a plataforma reconhecer a pessoa e creditar a
 *   campanha certa.
 * - **Carro marcado como vendido.** Vale para a venda que não nasceu de lead
 *   nenhum (balcão, indicação). Se um lead daquele carro já foi ganho, o
 *   evento NÃO sai de novo: a venda é a mesma.
 *
 * O `eventId` é derivado do que aconteceu (`sale-lead-<id>`,
 * `sale-vehicle-<id>`), não sorteado: marcar ganho, desmarcar e marcar de
 * novo manda o mesmo id, e a plataforma reconhece como repetição em vez de
 * contar duas vendas.
 */

async function vehiclePriceReais(tenantId: string, vehicleId: string | null): Promise<number | null> {
  if (!vehicleId) return null;
  const db = await getDb();
  const rows = await db
    .select({ priceCents: vehicles.priceCents, priceOnRequest: vehicles.priceOnRequest })
    .from(vehicles)
    .where(and(eq(vehicles.tenantId, tenantId), eq(vehicles.id, vehicleId)))
    .limit(1);

  const found = rows[0];
  if (!found || found.priceOnRequest || found.priceCents <= 0) return null;
  return found.priceCents / 100;
}

/** Venda que veio de um lead: é a que tem quem comprou. */
export async function trackLeadWon(tenantId: string, lead: Lead): Promise<void> {
  await trackInBackground(tenantId, {
    name: "sale",
    eventId: `sale-lead-${lead.id}`,
    value: await vehiclePriceReais(tenantId, lead.vehicleId),
    user: {
      email: lead.email,
      // lead de portal chega sem telefone; o resto do casamento ainda vale
      phone: lead.phone || null,
      name: lead.name,
    },
    content: lead.vehicleId ? { id: lead.vehicleId, name: lead.vehicleLabel } : undefined,
  });
}

/**
 * Venda marcada no estoque.
 *
 * Só dispara quando nenhum lead daquele carro foi ganho — senão seria a
 * mesma venda contada duas vezes, e o relatório de mídia passaria a mostrar
 * o dobro de receita, que é pior do que não medir.
 */
export async function trackVehicleSold(tenantId: string, vehicleId: string): Promise<void> {
  const db = await getDb();
  const won = await db
    .select({ id: leads.id })
    .from(leads)
    .where(
      and(
        eq(leads.tenantId, tenantId),
        eq(leads.vehicleId, vehicleId),
        eq(leads.status, "won"),
      ),
    )
    .limit(1);
  if (won[0]) return;

  await trackInBackground(tenantId, {
    name: "sale",
    eventId: `sale-vehicle-${vehicleId}`,
    value: await vehiclePriceReais(tenantId, vehicleId),
    content: { id: vehicleId },
  });
}
