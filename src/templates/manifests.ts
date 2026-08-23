/**
 * Manifestos dos templates — dados puros, sem React.
 * Os painéis importam só este arquivo (não puxam o código dos templates para o bundle).
 * Os componentes ficam em src/templates/registry.ts.
 */

export type TemplateCustomization = "primary" | "accent" | "surface" | "fontHeading" | "fontBody";

export type TemplateManifest = {
  id: string;
  name: string;
  description: string;
  /** Estética resumida, para o card de seleção. */
  vibe: string;
  /** Cores do preview no painel (não afetam o site publicado). */
  preview: { background: string; foreground: string; accent: string };
  supports: TemplateCustomization[];
  status: "ready" | "coming_soon";
};

export const TEMPLATE_MANIFESTS: TemplateManifest[] = [
  {
    id: "template-1-clean",
    name: "Clean",
    description: "Layout claro e arejado, foco nas fotos e na leitura rápida da ficha.",
    vibe: "Claro · minimalista",
    preview: { background: "#f8fafc", foreground: "#0f172a", accent: "#2563eb" },
    supports: ["primary", "accent", "surface", "fontHeading", "fontBody"],
    status: "ready",
  },
  {
    id: "template-2-dark",
    name: "Sport",
    description: "Visual escuro e agressivo, estilo loja de esportivos e seminovos premium.",
    vibe: "Escuro · alto contraste",
    preview: { background: "#0b0b0f", foreground: "#fafafa", accent: "#f43f5e" },
    supports: ["primary", "accent", "surface", "fontHeading", "fontBody"],
    status: "ready",
  },
  {
    id: "template-3",
    name: "Template 3",
    description: "Reservado para o próximo design.",
    vibe: "A definir",
    preview: { background: "#eef2ff", foreground: "#1e1b4b", accent: "#6366f1" },
    supports: ["primary", "accent"],
    status: "coming_soon",
  },
  {
    id: "template-4",
    name: "Template 4",
    description: "Reservado para o próximo design.",
    vibe: "A definir",
    preview: { background: "#ecfdf5", foreground: "#052e16", accent: "#10b981" },
    supports: ["primary", "accent"],
    status: "coming_soon",
  },
  {
    id: "template-5",
    name: "Template 5",
    description: "Reservado para o próximo design.",
    vibe: "A definir",
    preview: { background: "#fff7ed", foreground: "#431407", accent: "#f97316" },
    supports: ["primary", "accent"],
    status: "coming_soon",
  },
];

export const DEFAULT_TEMPLATE_ID = "template-1-clean";

export const TEMPLATE_IDS = TEMPLATE_MANIFESTS.map((template) => template.id);

export function getTemplateManifest(id: string): TemplateManifest {
  return TEMPLATE_MANIFESTS.find((template) => template.id === id) ?? TEMPLATE_MANIFESTS[0];
}

export function isTemplateSelectable(id: string): boolean {
  return TEMPLATE_MANIFESTS.some(
    (template) => template.id === id && template.status === "ready",
  );
}
