import type { ComponentType } from "react";
import type { BodyType, Fuel, Transmission, VehicleStatus } from "@/db/schema";

/**
 * CONTRATO DOS TEMPLATES.
 *
 * Todo template recebe exatamente estes dados e devolve as páginas do site
 * público. Nenhum template acessa banco, sessão ou binding — só apresentação.
 * Trocar de template nunca perde dado porque os dados vivem fora daqui.
 */

/**
 * Tokens de tema, na medida em que os desenhos os usam.
 *
 * Os seis primeiros são os originais e continuam no lugar — os templates
 * antigos dependem deles. Os demais entraram quando os três desenhos do Figma
 * mostraram que seis não bastam: todos os três distinguem fundo de página de
 * fundo de card, texto principal de texto secundário, e cada um tem um raio
 * próprio (12px, 6px, 8px) que é metade da identidade dele.
 *
 * Tudo tem valor padrão, então acrescentar token aqui não quebra revenda
 * nenhuma: `loadSiteData` funde o que a revenda salvou por cima do padrão.
 */
export type ThemeTokens = {
  /** Cor da marca: botão principal, link, destaque. */
  primary: string;
  /** A mesma cor um passo mais escura, para hover e estado pressionado. */
  primaryHover: string;
  /** O que fica legível EM CIMA da cor da marca. */
  primaryForeground: string;
  accent: string;
  /** Texto principal. */
  text: string;
  /** Texto de apoio: legenda, rótulo, dado secundário. */
  muted: string;
  /** Linha divisória e contorno de card. */
  border: string;
  /** Fundo da página. */
  background: string;
  /** Fundo do card, elevado sobre o fundo da página. */
  surface: string;
  /**
   * Verde de confirmação.
   *
   * Não é o verde do WhatsApp: aquele é fixo em todos os templates porque é
   * marca de terceiro, e mudá-lo por revenda faria o botão deixar de ser
   * reconhecido como WhatsApp.
   */
  success: string;
  fontHeading: string;
  fontBody: string;
  /** Raio dos cards, com unidade ("12px"). */
  radius: string;
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

/**
 * Número de vitrine: "+300 / veículos vendidos".
 *
 * Texto livre em vez de número, de propósito — a revenda escreve "+300",
 * "4,9/5" e "10 anos", que não são a mesma grandeza e não devem ser
 * formatados por nós.
 */
export type SiteStat = { value: string; label: string };

/** Valores que a simulação de financiamento assume antes de a pessoa mexer. */
export type FinancingDefaults = {
  /** Entrada sugerida, em porcentagem do valor do veículo. */
  downPaymentPercent: number;
  /** Prazos oferecidos no seletor, em meses. */
  terms: number[];
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
  /** Até três; vazio esconde a faixa inteira em vez de mostrar zeros. */
  stats: SiteStat[];
  financing: FinancingDefaults;
  legal: { privacy: string | null; terms: string | null; updatedAt: string | null };
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
  financing: string;
  sellCar: string;
  about: string;
  privacy: string;
  terms: string;
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

/**
 * Simulação de financiamento na página pública.
 *
 * O formulário vem pronto do app, como o de lead: a conta e o envio dependem
 * de estado e de rota, e template não fala com servidor. O template posiciona
 * e escolhe a moldura.
 *
 * `vehicles` é a lista para o seletor "escolha o veículo" — a simulação parte
 * de um carro do estoque, não de um valor digitado do nada.
 */
export type FinancingProps = BaseTemplateProps & {
  vehicles: VehicleView[];
  defaults: FinancingDefaults;
  simulatorForm: React.ReactNode;
};

/**
 * "Venda seu carro": a ponta pública da avaliação.
 *
 * O formulário cai como lead na revenda, com os dados do veículo do cliente —
 * é de lá que nasce a avaliação que o vendedor completa no painel.
 */
export type SellCarProps = BaseTemplateProps & {
  sellForm: React.ReactNode;
};

export type AboutProps = BaseTemplateProps & {
  totalVehicles: number;
};

/**
 * Páginas de texto corrido: privacidade e termos.
 *
 * `body` chega como texto simples da revenda. O template cuida da tipografia
 * e da largura de leitura; não tem seção nem card, porque o conteúdo é
 * jurídico e varia de tamanho de forma imprevisível.
 */
export type LegalProps = BaseTemplateProps & {
  kind: "privacidade" | "termos";
  title: string;
  body: string | null;
  updatedAt: string | null;
};

/**
 * As quatro páginas novas são OPCIONAIS.
 *
 * Os cinco templates antigos não as têm, e torná-las obrigatórias quebraria
 * todos eles de uma vez — justamente enquanto revendas de verdade os usam. A
 * rota devolve 404 quando o template escolhido não implementa a página, que é
 * a verdade: naquele desenho ela não existe.
 *
 * Quando os antigos forem aposentados, elas passam a obrigatórias e o
 * compilador cobra quem faltar.
 */
export type TemplateModule = {
  Home: ComponentType<HomeProps>;
  Listing: ComponentType<ListingProps>;
  VehicleDetail: ComponentType<VehicleDetailProps>;
  Contact: ComponentType<ContactProps>;
  Financing?: ComponentType<FinancingProps>;
  SellCar?: ComponentType<SellCarProps>;
  About?: ComponentType<AboutProps>;
  Legal?: ComponentType<LegalProps>;
};

export const DEFAULT_THEME: ThemeTokens = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  primaryForeground: "#ffffff",
  accent: "#0ea5e9",
  text: "#101828",
  muted: "#667085",
  border: "#e5e7eb",
  background: "#f7f8fa",
  surface: "#ffffff",
  success: "#16803c",
  fontHeading: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  fontBody: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  radius: "12px",
};

/**
 * Verde do WhatsApp, igual em todos os templates.
 *
 * Fica fora de `ThemeTokens` de propósito: é marca de terceiro, e uma revenda
 * que pintasse o botão de roxo perderia o reconhecimento instantâneo que é
 * justamente o valor dele.
 */
export const WHATSAPP_GREEN = "#16A34A";

/** Converte o tema do tenant em CSS variables — nada de cor hardcoded no template. */
export function themeToCssVariables(theme: ThemeTokens): Record<string, string> {
  return {
    "--site-primary": theme.primary,
    "--site-primary-hover": theme.primaryHover,
    "--site-primary-foreground": theme.primaryForeground,
    "--site-accent": theme.accent,
    "--site-text": theme.text,
    "--site-muted": theme.muted,
    "--site-border": theme.border,
    "--site-background": theme.background,
    "--site-surface": theme.surface,
    "--site-success": theme.success,
    "--site-font-heading": theme.fontHeading,
    "--site-font-body": theme.fontBody,
    "--site-radius": theme.radius,
    "--site-whatsapp": WHATSAPP_GREEN,
  };
}
