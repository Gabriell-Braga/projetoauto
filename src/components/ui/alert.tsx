import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Fundo suave, borda na cor do estado.
 *
 * Não depende só da cor para comunicar: o texto carrega a mensagem, e o
 * chamador põe ícone quando o estado precisa saltar.
 */
const TONES = {
  info: "border-accent/30 bg-accent-soft text-text",
  warning: "border-warning/40 bg-warning-soft text-text",
  danger: "border-danger/40 bg-danger-soft text-text",
  success: "border-positive/40 bg-positive-soft text-text",
} as const;

/** Faixa com borda de 2px à esquerda na cor do estado — nada de card colorido. */
export function Alert({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof TONES;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-inner border px-6 py-4 text-base leading-relaxed",
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
