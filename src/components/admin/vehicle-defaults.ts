import type { VehicleFormValues } from "./vehicle-form-types";

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Valores iniciais de um veículo novo.
 * Fica fora do arquivo "use client" porque a página de cadastro (server
 * component) precisa chamar esta função no servidor.
 */
export function emptyVehicle(): VehicleFormValues {
  return {
    brand: "",
    model: "",
    version: "",
    yearManufacture: CURRENT_YEAR,
    yearModel: CURRENT_YEAR,
    mileageKm: 0,
    priceCents: 0,
    priceOnRequest: false,
    transmission: "",
    fuel: "",
    bodyType: "",
    color: "",
    doors: "",
    licensePlateEnd: "",
    options: [],
    description: "",
    status: "draft",
    featured: false,
    fipeCode: null,
    fipePriceCents: null,
    fipeReference: null,
  };
}
