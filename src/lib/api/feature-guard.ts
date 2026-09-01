import { forbidden } from "@/lib/http";
import { getEntitlements } from "@/lib/plans/service";
import { hasFeature, featureTier } from "@/lib/plans/entitlements";
import { getFeature } from "@/lib/plans/catalog";

/**
 * Exige que o plano da revenda inclua a funcionalidade.
 *
 * A mensagem nomeia o recurso pelo rótulo do catálogo em vez da chave técnica:
 * quem lê é o dono da revenda, e "funil_comercial não disponível" não diz a
 * ele o que contratar.
 */
export async function requireFeature(tenantId: string, key: string): Promise<void> {
  const entitlements = await getEntitlements(tenantId);
  if (hasFeature(entitlements, key)) return;

  const label = getFeature(key)?.label ?? key;
  throw forbidden(`${label} não está incluído no plano desta revenda.`);
}

/** Nível contratado da funcionalidade, ou null quando ela não está no plano. */
export async function tierOf(tenantId: string, key: string): Promise<string | null> {
  const entitlements = await getEntitlements(tenantId);
  return featureTier(entitlements, key);
}

/** Versão silenciosa, para a tela decidir o que mostrar sem lançar erro. */
export async function tenantHasFeature(tenantId: string, key: string): Promise<boolean> {
  return hasFeature(await getEntitlements(tenantId), key);
}
