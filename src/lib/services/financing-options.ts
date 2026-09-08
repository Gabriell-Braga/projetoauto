import { PUBLIC_VEHICLE_STATUSES } from "./public-site";
import { toVehicleCard } from "./site";
import { getVehicle, listVehicles } from "./vehicles";

export type FinancingOption = { id: string; label: string; priceCents: number };

/** Quantos carros cabem no seletor sem virar uma lista impossível de percorrer. */
const LIMITE = 60;

/**
 * Os veículos que o simulador oferece.
 *
 * Só entra o que tem preço publicado: financiar "sob consulta" não existe, e um
 * carro sem valor no seletor produziria uma conta com zero de um lado.
 *
 * O veículo que veio pela URL é garantido na lista mesmo fora do limite. Sem
 * isso, uma revenda com duzentos carros teria o link "Simular financiamento"
 * da ficha caindo numa página com OUTRO carro selecionado — e a pessoa
 * enviaria a simulação errada sem perceber que trocou.
 */
export async function financingOptions(
  tenantId: string,
  preselectedId?: string,
): Promise<FinancingOption[]> {
  const stock = await listVehicles(tenantId, {
    statuses: [...PUBLIC_VEHICLE_STATUSES],
    sort: "preco-asc",
    page: 1,
    pageSize: LIMITE,
  });

  const options = stock.items
    .map(toVehicleCard)
    .filter((item) => !item.priceOnRequest)
    .map(toOption);

  if (!preselectedId || options.some((item) => item.id === preselectedId)) {
    return options;
  }

  const found = await getVehicle(tenantId, preselectedId);
  const vehicle = found?.vehicle ?? null;
  if (
    !vehicle ||
    vehicle.priceOnRequest ||
    !PUBLIC_VEHICLE_STATUSES.some((status) => status === vehicle.status)
  ) {
    return options;
  }

  // entra no topo: é o carro que a pessoa estava olhando
  return [
    {
      id: vehicle.id,
      label: [vehicle.brand, vehicle.model, vehicle.version].filter(Boolean).join(" "),
      priceCents: vehicle.priceCents,
    },
    ...options,
  ];
}

function toOption(vehicle: ReturnType<typeof toVehicleCard>): FinancingOption {
  return {
    id: vehicle.id,
    label: `${vehicle.title} ${vehicle.yearLabel}`,
    priceCents: vehicle.priceCents,
  };
}
