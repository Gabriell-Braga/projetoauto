import type { BillingStatus, BodyType, Fuel, LeadStatus, Transmission, VehicleStatus } from "@/db/schema";

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: "Manual",
  automatico: "Automático",
  automatizado: "Automatizado",
  cvt: "CVT",
};

export const FUEL_LABELS: Record<Fuel, string> = {
  flex: "Flex",
  gasolina: "Gasolina",
  etanol: "Etanol",
  diesel: "Diesel",
  gnv: "GNV",
  hibrido: "Híbrido",
  eletrico: "Elétrico",
};

export const BODY_TYPE_LABELS: Record<BodyType, string> = {
  hatch: "Hatch",
  sedan: "Sedã",
  suv: "SUV",
  picape: "Picape",
  minivan: "Minivan",
  cupe: "Cupê",
  conversivel: "Conversível",
  utilitario: "Utilitário",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  draft: "Rascunho",
  available: "Disponível",
  reserved: "Reservado",
  sold: "Vendido",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  in_progress: "Em atendimento",
  won: "Convertido",
  lost: "Perdido",
};

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  adimplente: "Adimplente",
  inadimplente: "Inadimplente",
  suspenso: "Suspensa",
};

export const COLORS = [
  "Branco", "Prata", "Preto", "Cinza", "Vermelho", "Azul", "Verde",
  "Marrom", "Bege", "Amarelo", "Laranja", "Dourado", "Vinho",
];
