import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge de status no estilo "luz de painel": ponto colorido + rótulo em caixa
 * alta. Sem fundo pintado — a cor mora no ponto, não no bloco.
 */
const TONE_DOT: Record<string, string> = {
  neutral: "bg-faint",
  success: "bg-positive",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-accent",
};

export type BadgeTone = keyof typeof TONE_DOT;

export function Badge({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "label-instrument inline-flex items-center gap-1.5 whitespace-nowrap text-text",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", TONE_DOT[tone] ?? TONE_DOT.neutral)}
      />
      {children}
    </span>
  );
}

/** Variante com fundo, para quando o badge precisa se destacar sozinho. */
export function BadgeSoft({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  const background: Record<string, string> = {
    neutral: "bg-surface-2 text-muted",
    success: "bg-positive-soft text-positive",
    warning: "bg-warning-soft text-accent-text",
    danger: "bg-danger-soft text-danger",
    info: "bg-accent-soft text-accent-text",
  };

  return (
    <span
      className={cn(
        "label-instrument inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-1.5 py-0.5",
        background[tone] ?? background.neutral,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
