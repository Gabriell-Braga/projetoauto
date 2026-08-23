import type { TemplateModule } from "./contract";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MANIFESTS } from "./manifests";
import templateClean from "./template-1-clean";
import templateDark from "./template-2-dark";
import template3 from "./template-3";
import template4 from "./template-4";
import template5 from "./template-5";

/**
 * Registry dos templates: id do manifesto -> componentes das páginas públicas.
 * Importado somente pelas rotas de /r/[slug]; os painéis usam apenas os
 * manifestos, para não carregar o código dos templates no bundle do admin.
 */
export const TEMPLATE_REGISTRY: Record<string, TemplateModule> = {
  "template-1-clean": templateClean,
  "template-2-dark": templateDark,
  "template-3": template3,
  "template-4": template4,
  "template-5": template5,
};

export function getTemplate(templateId: string): TemplateModule {
  return TEMPLATE_REGISTRY[templateId] ?? TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_ID];
}

/** Garante que todo manifesto tem implementação registrada. */
export function assertRegistryIntegrity(): string[] {
  return TEMPLATE_MANIFESTS.filter((manifest) => !TEMPLATE_REGISTRY[manifest.id]).map(
    (manifest) => manifest.id,
  );
}
