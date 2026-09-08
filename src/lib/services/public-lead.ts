import { getDb } from "@/db";
import { financings, vehicleAppraisals } from "@/db/schema";
import { tenantHasFeature } from "@/lib/api/feature-guard";
import { financedAmount } from "@/lib/services/financings";
import { suggestedOffer } from "@/lib/services/appraisals";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { PublicLeadInput } from "@/lib/validation/leads";

/**
 * O que o cliente preencheu, escrito para quem vai atender.
 *
 * O vendedor abre o lead e precisa entender em três segundos o que a pessoa
 * quer. Guardar só os campos estruturados obrigaria a olhar duas telas; jogar
 * o JSON no corpo da mensagem seria pior ainda. Então o texto é montado aqui,
 * em português, e os dados estruturados vão para a proposta ou a avaliação.
 */
export function composeLeadMessage(input: PublicLeadInput): string | null {
  const escrito = input.message?.trim() || null;

  if (input.kind === "financiamento" && input.financing) {
    const linhas = [
      "Simulação de financiamento pelo site:",
      `· Entrada: ${formatCurrency(input.financing.downPaymentCents)}`,
      `· Prazo: ${input.financing.installments}x`,
    ];
    if (escrito) linhas.push("", escrito);
    return linhas.join("\n");
  }

  if (input.kind === "venda" && input.sellCar) {
    const carro = input.sellCar;
    const nome = [carro.brand, carro.model, carro.version].filter(Boolean).join(" ");
    const linhas = [
      "Quer vender o carro pelo site:",
      `· Veículo: ${nome}`,
      `· Ano: ${carro.yearManufacture}/${carro.yearModel}`,
      `· Quilometragem: ${formatNumber(carro.mileageKm)} km`,
    ];
    if (escrito) linhas.push("", escrito);
    return linhas.join("\n");
  }

  return escrito;
}

/**
 * Cria o registro de trabalho que nasce junto do lead.
 *
 * Simulação vira proposta de financiamento em rascunho; "venda seu carro" vira
 * avaliação em rascunho, com o veículo já preenchido. Assim o vendedor abre o
 * painel e encontra a ficha começada em vez de um recado pedindo para
 * redigitar o que o cliente já digitou.
 *
 * Respeita o plano: revenda sem a funcionalidade contratada recebe o lead
 * normalmente e nada mais. Perder o lead porque o plano não cobre o extra
 * seria punir a revenda pelo que ela não comprou.
 *
 * Nunca derruba a captação — quem chama trata a falha como aviso, não como
 * erro: o lead já está salvo, e é ele que não pode se perder.
 */
export async function createIntentRecord(
  tenantId: string,
  input: PublicLeadInput,
  vehicle: { id: string | null; label: string | null; priceCents: number },
): Promise<{ kind: "financing" | "appraisal"; id: string } | null> {
  const db = await getDb();

  if (input.kind === "financiamento" && input.financing) {
    if (!(await tenantHasFeature(tenantId, "gestao_financiamentos"))) return null;

    const created = await db
      .insert(financings)
      .values({
        tenantId,
        vehicleId: vehicle.id,
        vehicleLabel: vehicle.label,
        customerName: input.name,
        customerPhone: input.phone,
        vehiclePriceCents: vehicle.priceCents,
        downPaymentCents: input.financing.downPaymentCents,
        financedCents: financedAmount(vehicle.priceCents, input.financing.downPaymentCents),
        installments: input.financing.installments,
        // a parcela sai da análise do banco; o site não promete valor de parcela
        installmentCents: 0,
        status: "rascunho",
        notes: "Simulação enviada pelo site.",
      })
      .returning({ id: financings.id });

    return { kind: "financing", id: created[0].id };
  }

  if (input.kind === "venda" && input.sellCar) {
    if (!(await tenantHasFeature(tenantId, "avaliacao_veiculos"))) return null;

    const carro = input.sellCar;
    const created = await db
      .insert(vehicleAppraisals)
      .values({
        tenantId,
        customerName: input.name,
        customerPhone: input.phone,
        brand: carro.brand,
        model: carro.model,
        version: carro.version || null,
        yearManufacture: carro.yearManufacture,
        yearModel: carro.yearModel,
        mileageKm: carro.mileageKm,
        /*
         * Tudo zerado de propósito, inclusive o sugerido.
         *
         * A referência da FIPE depende de uma consulta que sai do NAVEGADOR de
         * quem avalia — o servidor não consegue fazer, e chutar um valor aqui
         * viraria número na tela que ninguém calculou. O vendedor abre a ficha,
         * consulta a FIPE e a conta acontece com dado real.
         */
        suggestedCents: suggestedOffer({
          fipePriceCents: 0,
          conditionCents: 0,
          repairsCents: 0,
          debtsCents: 0,
          marketAdjustCents: 0,
        }),
        status: "rascunho",
        notes: "Enviado pelo cliente no site.",
      })
      .returning({ id: vehicleAppraisals.id });

    return { kind: "appraisal", id: created[0].id };
  }

  return null;
}
