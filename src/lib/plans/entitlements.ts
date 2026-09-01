import {
  FALLBACK_LIMITS,
  getFeature,
  type LimitKey,
  type PlanFeatures,
  type PlanLimits,
} from "./catalog";

/**
 * Direitos de uma revenda: o que ela pode usar e até quanto.
 *
 * Módulo puro — sem banco e sem bindings — para a mesma regra valer na API,
 * na tela e no teste. Quem carrega o plano é o service; aqui só se decide.
 */
export type Entitlements = {
  planId: string | null;
  planName: string | null;
  limits: Record<LimitKey, number | null>;
  features: PlanFeatures;
};

export type PlanSnapshot = {
  id: string;
  name: string;
  limits: PlanLimits | null;
  features: PlanFeatures | null;
} | null;

/**
 * Revenda sem plano não fica travada: cai no fallback, que reproduz o
 * comportamento que o produto já tinha antes de existir plano.
 */
export function buildEntitlements(plan: PlanSnapshot): Entitlements {
  if (!plan) {
    return {
      planId: null,
      planName: null,
      limits: { ...FALLBACK_LIMITS },
      features: {},
    };
  }

  return {
    planId: plan.id,
    planName: plan.name,
    limits: { ...FALLBACK_LIMITS, ...(plan.limits ?? {}) },
    features: plan.features ?? {},
  };
}

/** `null` = ilimitado. */
export function limitOf(entitlements: Entitlements, key: LimitKey): number | null {
  return entitlements.limits[key] ?? null;
}

export function limitReached(
  entitlements: Entitlements,
  key: LimitKey,
  current: number,
): boolean {
  const limit = limitOf(entitlements, key);
  if (limit === null) return false;
  return current >= limit;
}

/** Quanto ainda cabe; `null` quando é ilimitado. */
export function remaining(
  entitlements: Entitlements,
  key: LimitKey,
  current: number,
): number | null {
  const limit = limitOf(entitlements, key);
  if (limit === null) return null;
  return Math.max(0, limit - current);
}

export function hasFeature(entitlements: Entitlements, key: string): boolean {
  const value = entitlements.features[key];
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return value !== "";
}

/** Nível contratado de uma funcionalidade em degraus (básico/completo/…). */
export function featureTier(entitlements: Entitlements, key: string): string | null {
  const value = entitlements.features[key];
  return typeof value === "string" && value ? value : null;
}

/** Quantidade contratada de uma funcionalidade numérica. */
export function featureQuota(entitlements: Entitlements, key: string): number {
  const value = entitlements.features[key];
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return 0;
}

/** `true` quando o degrau contratado alcança o exigido. */
export function tierAtLeast(
  entitlements: Entitlements,
  key: string,
  required: string,
): boolean {
  const definition = getFeature(key);
  if (!definition || definition.kind !== "tier") return hasFeature(entitlements, key);

  const order = definition.tiers.map((tier) => tier.value);
  const current = featureTier(entitlements, key);
  if (!current) return false;

  return order.indexOf(current) >= order.indexOf(required);
}

export type LimitCheck = {
  allowed: boolean;
  limit: number | null;
  current: number;
  message?: string;
};

const LIMIT_MESSAGES: Record<LimitKey, (limit: number) => string> = {
  maxVehicles: (limit) =>
    `Seu plano permite ${limit} veículos ativos. Venda ou arquive um anúncio, ou fale com o suporte para subir de plano.`,
  maxUsers: (limit) =>
    `Seu plano permite ${limit} usuários. Desative um acesso ou fale com o suporte para subir de plano.`,
  maxStores: (limit) => `Seu plano permite ${limit} loja(s).`,
  maxPhotosPerVehicle: (limit) => `Limite de ${limit} fotos por veículo atingido.`,
  maxBanners: (limit) => `Limite de ${limit} banners atingido.`,
};

/** Checagem pronta para virar erro de API, com mensagem que explica a saída. */
export function checkLimit(
  entitlements: Entitlements,
  key: LimitKey,
  current: number,
): LimitCheck {
  const limit = limitOf(entitlements, key);
  if (limit === null) return { allowed: true, limit: null, current };

  const allowed = current < limit;
  return {
    allowed,
    limit,
    current,
    message: allowed ? undefined : LIMIT_MESSAGES[key](limit),
  };
}
