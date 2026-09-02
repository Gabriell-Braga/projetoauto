/**
 * Catálogo de funcionalidades da plataforma.
 *
 * É a fonte da verdade do que um plano pode ligar/desligar. O CMS de planos no
 * Painel Geral é gerado a partir daqui — acrescentar item aqui faz aparecer no
 * formulário sem mexer em tela.
 *
 * `status` diz se a funcionalidade existe de fato hoje. Serve para o painel
 * avisar que ligar aquele item ainda não entrega nada, em vez de vender no
 * escuro.
 */

export type FeatureStatus = "pronto" | "em_construcao" | "depende_de_fornecedor";

export type FeatureKind =
  | { kind: "boolean" }
  | { kind: "tier"; tiers: { value: string; label: string }[] }
  | { kind: "number"; unit: string };

export type FeatureDefinition = {
  key: string;
  label: string;
  group: string;
  status: FeatureStatus;
  /** Explica a dependência externa quando houver. */
  note?: string;
} & FeatureKind;

export const FEATURE_GROUPS = ["Estoque", "Site", "Comercial", "Operação"] as const;

export const FEATURES: FeatureDefinition[] = [
  // ---------------------------------------------------------------- Estoque
  { key: "gestao_estoque", label: "Gestão de estoque", group: "Estoque", status: "pronto", kind: "boolean" },
  { key: "gerenciador_ofertas", label: "Gerenciador de ofertas", group: "Estoque", status: "pronto", kind: "boolean" },
  /*
   * A consulta por placa saiu de cena: as APIs do gênero são todas pagas por
   * consulta, e o que elas devolvem — marca, modelo, versão, ano, combustível
   * — a tabela FIPE já entrega de graça a partir da escolha na lista. Pagar
   * por consulta para economizar três cliques não se paga.
   *
   * Com isso a funcionalidade deixou de depender de fornecedor: o
   * preenchimento automático que está no ar é o da FIPE.
   */
  {
    key: "preenchimento_automatico",
    label: "Preenchimento automático do veículo",
    group: "Estoque",
    status: "pronto",
    kind: "boolean",
  },
  {
    key: "avaliacao_veiculos",
    label: "Avaliação de veículos",
    group: "Estoque",
    status: "depende_de_fornecedor",
    note: "Precisa de fonte de preço de mercado.",
    kind: "boolean",
  },
  {
    key: "integracao_classificados",
    label: "Integração com classificados",
    group: "Estoque",
    status: "depende_de_fornecedor",
    note: "O feed de estoque já existe; falta o contrato com cada portal.",
    kind: "boolean",
  },

  // ------------------------------------------------------------------- Site
  { key: "site_automatico", label: "Site automático", group: "Site", status: "pronto", kind: "boolean" },
  { key: "hospedagem_manutencao", label: "Hospedagem e manutenção", group: "Site", status: "pronto", kind: "boolean" },
  { key: "seo_tecnico", label: "SEO técnico / performance", group: "Site", status: "pronto", kind: "boolean" },
  { key: "ga4_gtm", label: "GA4 + GTM + tracking", group: "Site", status: "pronto", kind: "boolean" },

  // --------------------------------------------------------------- Comercial
  {
    key: "crm_leads",
    label: "CRM / Gerenciador de leads",
    group: "Comercial",
    status: "pronto",
    kind: "tier",
    tiers: [
      { value: "basico", label: "Básico" },
      { value: "completo", label: "Completo" },
    ],
  },
  { key: "origem_campanha", label: "Origem/campanha do lead", group: "Comercial", status: "pronto", kind: "boolean" },
  {
    key: "funil_comercial",
    label: "Funil comercial",
    group: "Comercial",
    status: "pronto",
    kind: "tier",
    tiers: [
      { value: "basico", label: "Básico" },
      { value: "completo", label: "Completo" },
    ],
  },
  {
    key: "distribuicao_leads",
    label: "Distribuição automática de leads",
    group: "Comercial",
    status: "pronto",
    kind: "boolean",
  },
  {
    key: "whatsapp_integrado",
    label: "WhatsApp integrado",
    group: "Comercial",
    status: "pronto",
    kind: "number",
    unit: "números",
  },
  {
    key: "historico_conversas",
    label: "Histórico das conversas no CRM",
    group: "Comercial",
    status: "pronto",
    kind: "boolean",
  },
  {
    key: "dashboards",
    label: "Dashboards comerciais",
    group: "Comercial",
    status: "pronto",
    kind: "tier",
    tiers: [
      { value: "basico", label: "Básico" },
      { value: "completo", label: "Completo" },
      { value: "avancado", label: "Avançado" },
    ],
  },
  {
    key: "gestao_financiamentos",
    label: "Gestão de financiamentos",
    group: "Comercial",
    status: "pronto",
    kind: "boolean",
  },

  // ---------------------------------------------------------------- Operação
  {
    key: "gestao_multiunidade",
    label: "Gestão multiunidade",
    group: "Operação",
    status: "pronto",
    kind: "boolean",
  },
  {
    key: "permissoes_avancadas",
    label: "Permissões avançadas",
    group: "Operação",
    status: "pronto",
    kind: "boolean",
  },
  { key: "api_webhooks", label: "API / Webhooks", group: "Operação", status: "pronto", kind: "boolean" },
  {
    key: "suporte",
    label: "Suporte",
    group: "Operação",
    status: "pronto",
    kind: "tier",
    tiers: [
      { value: "digital", label: "Digital" },
      { value: "prioritario", label: "Prioritário" },
    ],
  },
];

export const FEATURE_KEYS = FEATURES.map((feature) => feature.key);

export function getFeature(key: string): FeatureDefinition | undefined {
  return FEATURES.find((feature) => feature.key === key);
}

/** Funcionalidades que ainda não entregam nada se forem ligadas. */
export function unreadyFeatures(features: Record<string, unknown>): FeatureDefinition[] {
  return FEATURES.filter((feature) => {
    if (feature.status === "pronto") return false;
    const value = features[feature.key];
    return value !== undefined && value !== false && value !== 0 && value !== "";
  });
}

/* ------------------------------------------------------------------------ */
/* Limites numéricos                                                         */
/* ------------------------------------------------------------------------ */

export type LimitKey =
  | "maxVehicles"
  | "maxUsers"
  | "maxStores"
  | "maxPhotosPerVehicle"
  | "maxBanners";

export type LimitDefinition = {
  key: LimitKey;
  label: string;
  hint: string;
};

/** `null` em qualquer limite significa ilimitado. */
export const LIMITS: LimitDefinition[] = [
  { key: "maxVehicles", label: "Veículos ativos", hint: "Não conta vendidos nem rascunhos" },
  { key: "maxUsers", label: "Usuários", hint: "Contas ativas no painel da revenda" },
  { key: "maxStores", label: "Lojas", hint: "Unidades da mesma revenda" },
  { key: "maxPhotosPerVehicle", label: "Fotos por veículo", hint: "Limite por anúncio" },
  { key: "maxBanners", label: "Banners da home", hint: "Banners ativos no site" },
];

export type PlanLimits = Partial<Record<LimitKey, number | null>>;
export type PlanFeatures = Record<string, boolean | string | number>;

/** Usado quando a revenda não tem plano — mantém o comportamento atual. */
export const FALLBACK_LIMITS: Required<Record<LimitKey, number | null>> = {
  maxVehicles: null,
  maxUsers: null,
  maxStores: 1,
  maxPhotosPerVehicle: 40,
  maxBanners: 8,
};
