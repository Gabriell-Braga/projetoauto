import type { ComponentType } from "react";
import type { BodyType, Fuel, Transmission, VehicleStatus } from "@/db/schema";

/**
 * CONTRATO DOS TEMPLATES.
 *
 * Todo template recebe exatamente estes dados e devolve as páginas do site
 * público. Nenhum template acessa banco, sessão ou binding — só apresentação.
 * Trocar de template nunca perde dado porque os dados vivem fora daqui.
 */

export type ThemeTokens = {
  primary: string;
  primaryForeground: string;
  accent: string;
  surface: string;
  fontHeading: string;
  fontBody: string;
};

export type SiteContact = {
  phone: string | null;
  whatsapp: string | null;
  whatsappDigits: string | null;
  email: string | null;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    district: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    full: string | null;
  };
  mapsUrl: string | null;
  businessHours: { weekday: number; open: string | null; close: string | null }[];
  social: { instagram?: string; facebook?: string; youtube?: string; tiktok?: string };
};

export type SiteBanner = {
  id: string;
  imageUrl: string | null;
  imageUrlMobile: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type SiteData = {
  tenantId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  theme: ThemeTokens;
  contact: SiteContact;
  aboutTitle: string | null;
  aboutText: string | null;
  banners: SiteBanner[];
};

export type VehiclePhotoView = {
  id: string;
  thumb: string;
  card: string;
  full: string;
};

export type VehicleView = {
  id: string;
  slug: string;
  title: string;
  brand: string;
  model: string;
  version: string | null;
  yearManufacture: number;
  yearModel: number;
  yearLabel: string;
  mileageKm: number;
  mileageLabel: string;
  priceCents: number;
  priceOnRequest: boolean;
  priceLabel: string;
  status: VehicleStatus;
  statusLabel: string;
  featured: boolean;
  transmission: Transmission | null;
  transmissionLabel: string | null;
  fuel: Fuel | null;
  fuelLabel: string | null;
  bodyType: BodyType | null;
  bodyTypeLabel: string | null;
  color: string | null;
  doors: number | null;
  licensePlateEnd: string | null;
  options: { key: string; label: string; group: string }[];
  description: string | null;
  coverUrl: string | null;
  photos: VehiclePhotoView[];
};

/** Links já prontos, respeitando o mount path e o slug do tenant. */
export type SiteLinks = {
  home: string;
  stock: string;
  contact: string;
  vehicle: (slug: string) => string;
  stockWith: (params: Record<string, string | number | undefined>) => string;
  whatsapp: (message: string) => string | null;
};

export type StockFacets = {
  brands: { brand: string; models: string[] }[];
  transmissions: (Transmission | null)[];
  fuels: (Fuel | null)[];
  bodyTypes: (BodyType | null)[];
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
};

export type AppliedFilters = {
  search?: string;
  brand?: string;
  model?: string;
  transmission?: string;
  fuel?: string;
  bodyType?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMax?: number;
  sort: string;
};

export type BaseTemplateProps = {
  site: SiteData;
  links: SiteLinks;
};

export type HomeProps = BaseTemplateProps & {
  featured: VehicleView[];
  latest: VehicleView[];
  facets: StockFacets;
  totalVehicles: number;
};

export type ListingProps = BaseTemplateProps & {
  vehicles: VehicleView[];
  facets: StockFacets;
  filters: AppliedFilters;
  total: number;
  page: number;
  pageSize: number;
};

export type VehicleDetailProps = BaseTemplateProps & {
  vehicle: VehicleView;
  related: VehicleView[];
  /** Formulário de lead injetado pelo app (o template só posiciona). */
  leadForm: React.ReactNode;
};

export type ContactProps = BaseTemplateProps;

export type TemplateModule = {
  Home: ComponentType<HomeProps>;
  Listing: ComponentType<ListingProps>;
  VehicleDetail: ComponentType<VehicleDetailProps>;
  Contact: ComponentType<ContactProps>;
};

export const DEFAULT_THEME: ThemeTokens = {
  primary: "#2563eb",
  primaryForeground: "#ffffff",
  accent: "#0ea5e9",
  surface: "#ffffff",
  fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

/** Converte o tema do tenant em CSS variables — nada de cor hardcoded no template. */
export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  return {
    "--site-primary": theme.primary,
    "--site-primary-foreground": theme.primaryForeground,
    "--site-accent": theme.accent,
    "--site-surface": theme.surface,
    "--site-font-heading": theme.fontHeading,
    "--site-font-body": theme.fontBody,
  };
}
