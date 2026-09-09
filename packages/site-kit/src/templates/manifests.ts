/**
 * Manifestos dos templates — dados puros, sem React.
 * Os painéis importam só este arquivo (não puxam o código dos templates para o bundle).
 * Os componentes ficam em src/templates/registry.ts.
 */

import type { ThemeTokens } from "./contract";

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
  /**
   * A paleta e a tipografia com que o template foi desenhado.
   *
   * Entra ENTRE o padrão da plataforma e o que a revenda escolheu: quem não
   * mexeu em nada vê o template como ele foi desenhado, e quem escolheu a
   * própria cor continua mandando. Sem isso, escolher "Vitrine" entregaria a
   * estrutura do desenho pintada com o azul genérico do sistema — e o
   * template pareceria quebrado sem estar.
   */
  defaultTheme?: Partial<ThemeTokens>;
};

export const TEMPLATE_MANIFESTS: TemplateManifest[] = [
  /*
   * Os três desenhados no Figma vêm primeiro: são os que a revenda deve
   * escolher hoje. Os cinco antigos continuam na lista enquanto houver
   * revenda usando, e saem quando todas migrarem.
   */
  {
    id: "vitrine",
    name: "Vitrine",
    description:
      "Claro e direto, com busca em primeiro plano e páginas de financiamento, avaliação e institucional.",
    vibe: "Claro · loja própria",
    preview: { background: "#F7F8FA", foreground: "#101828", accent: "#0F5FD7" },
    supports: ["primary", "accent", "surface", "fontHeading", "fontBody"],
    status: "ready",
    defaultTheme: {
      primary: "#0F5FD7",
      primaryHover: "#0B4CAE",
      primaryForeground: "#FFFFFF",
      accent: "#0F5FD7",
      text: "#101828",
      muted: "#667085",
      border: "#D9DDE3",
      background: "#F7F8FA",
      surface: "#FFFFFF",
      success: "#16803C",
      fontHeading: "var(--font-dm-sans), system-ui, sans-serif",
      fontBody: "var(--font-dm-sans), system-ui, sans-serif",
      radius: "12px",
    },
  },
  {
    id: "showroom",
    name: "Showroom",
    description:
      "Editorial e amplo, com menu em gaveta, busca por abas e a foto do veiculo como protagonista.",
    vibe: "Claro · showroom",
    preview: { background: "#F4F7FB", foreground: "#0C1424", accent: "#4164F5" },
    supports: ["primary", "accent", "surface", "fontHeading", "fontBody"],
    status: "ready",
    defaultTheme: {
      primary: "#4164F5",
      primaryHover: "#2F4FD8",
      primaryForeground: "#FFFFFF",
      accent: "#4164F5",
      text: "#0C1424",
      muted: "#607086",
      border: "#DCE5F2",
      background: "#F4F7FB",
      surface: "#FFFFFF",
      success: "#169B50",
      fontHeading: "var(--font-manrope), system-ui, sans-serif",
      fontBody: "var(--font-manrope), system-ui, sans-serif",
      radius: "6px",
    },
  },
  {
    id: "marketplace",
    name: "Marketplace",
    description:
      "Busca no topo, contagem por categoria e cards densos: o formato de quem compara muito antes de decidir.",
    vibe: "Claro · marketplace",
    preview: { background: "#F7F9FA", foreground: "#111827", accent: "#0E7A4B" },
    supports: ["primary", "accent", "surface", "fontHeading", "fontBody"],
    status: "ready",
    defaultTheme: {
      primary: "#0E7A4B",
      primaryHover: "#0A613C",
      primaryForeground: "#FFFFFF",
      accent: "#0E7A4B",
      text: "#111827",
      muted: "#64748B",
      border: "#E5E7EB",
      background: "#F7F9FA",
      surface: "#FFFFFF",
      success: "#16A34A",
      fontHeading: "var(--font-archivo), system-ui, sans-serif",
      fontBody: "var(--font-archivo), system-ui, sans-serif",
      radius: "8px",
    },
  },
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

/**
 * Busca exata: devolve `undefined` quando o id não existe.
 *
 * É o que a montagem do tema precisa — um template desconhecido não pode
 * herdar a paleta de outro, porque o resultado seria um site pintado com as
 * cores de um desenho que ninguém escolheu.
 */
export function findTemplateManifest(id: string): TemplateManifest | undefined {
  return TEMPLATE_MANIFESTS.find((template) => template.id === id);
}

/**
 * Com reserva, para quem precisa de um manifesto de qualquer jeito.
 *
 * A reserva é o template PADRÃO, não o primeiro da lista: os dois eram a
 * mesma coisa até o Vitrine entrar no topo, e a partir daí `[0]` passaria a
 * discordar do que `getTemplate` devolve no registry — a tela do painel
 * mostraria um nome e o site renderizaria outro.
 */
export function getTemplateManifest(id: string): TemplateManifest {
  return (
    findTemplateManifest(id) ??
    findTemplateManifest(DEFAULT_TEMPLATE_ID) ??
    TEMPLATE_MANIFESTS[0]
  );
}

export function isTemplateSelectable(id: string): boolean {
  return TEMPLATE_MANIFESTS.some(
    (template) => template.id === id && template.status === "ready",
  );
}
