import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge de status.
 *
 * Chip com fundo suave, borda na cor do estado e raio de tag — um dos quatro
 * níveis de raio do sistema. A cor comunica estado, nunca decora: badge sem
 * significado não entra na tela.
 *
 * O ponto colorido continua ali de propósito. Cor sozinha não pode ser o único
 * portador da informação, e o ponto dá uma segunda pista de forma para quem
 * não distingue as cores.
 */
const TONE: Record<string, { dot: string; chip: string }> = {
  neutral: { dot: "bg-faint", chip: "border-border bg-surface-2 text-muted" },
  success: { dot: "bg-positive", chip: "border-positive/40 bg-positive-soft text-positive" },
  warning: { dot: "bg-warning", chip: "border-warning/40 bg-warning-soft text-warning" },
  danger: { dot: "bg-danger", chip: "border-danger/40 bg-danger-soft text-danger" },
  info: { dot: "bg-accent", chip: "border-accent/30 bg-accent-soft text-accent-text" },
};

export type BadgeTone = keyof typeof TONE;

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const style = TONE[tone] ?? TONE.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-tag border px-3 py-1",
        "text-sm font-medium",
        style.chip,
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      {children}
    </span>
  );
}

/**
 * Variante sem borda, para quando o badge convive com muitos outros elementos
 * e a borda viraria ruído — listas densas e cabeçalhos de card.
 */
export function BadgeSoft({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const style = TONE[tone] ?? TONE.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-tag px-3 py-1",
        "text-sm font-medium",
        style.chip.replace(/border-\S+/g, ""),
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      {children}
    </span>
  );
}
