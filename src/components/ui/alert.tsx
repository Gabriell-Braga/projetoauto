import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  info: "border-l-accent bg-accent-soft text-text",
  warning: "border-l-warning bg-warning-soft text-text",
  danger: "border-l-danger bg-danger-soft text-text",
  success: "border-l-positive bg-positive-soft text-text",
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
        "rounded border border-border border-l-2 px-3 py-2.5 text-[13px] leading-relaxed",
        TONES[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
