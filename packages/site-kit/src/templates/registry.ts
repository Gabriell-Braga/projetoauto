import type { TemplateModule } from "./contract";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MANIFESTS } from "./manifests";
import vitrine from "./vitrine";
import showroom from "./showroom";
import marketplace from "./marketplace";

/**
 * Registry dos templates: id do manifesto -> componentes das páginas públicas.
 *
 * Importado somente pelas rotas públicas; os painéis usam apenas os
 * manifestos, para não carregar o código dos templates no bundle do admin.
 */
export const TEMPLATE_REGISTRY: Record<string, TemplateModule> = {
  vitrine,
  showroom,
  marketplace,
};

export function getTemplate(templateId: string): TemplateModule {
  return TEMPLATE_REGISTRY[templateId] ?? TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}

/**
 * Manifesto oferecido no painel sem código por trás.
 *
 * Só vale para os `ready`: um `coming_soon` é uma vaga reservada, aparece
 * desabilitado na tela e ninguém consegue escolher — exigir implementação dele
 * seria exigir que a vaga já estivesse preenchida.
 */
export function assertRegistryIntegrity(): string[] {
  return TEMPLATE_MANIFESTS.filter(
    (manifest) => manifest.status === "ready" && !TEMPLATE_REGISTRY[manifest.id],
  ).map((manifest) => manifest.id);
}
