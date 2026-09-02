import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Superfície principal: raio de 40px, borda discreta, sem sombra.
 *
 * O documento é explícito: borda e contraste de superfície têm prioridade
 * sobre sombra, e o raio grande é assinatura do sistema.
 */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-theme-transition
      className={cn("rounded-card border border-border bg-surface", className)}
      {...props}
    />
  );
}

/** Card escuro: contraste para destaque, showcase e módulo premium. */
export function CardDark({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-theme-transition
      className={cn("rounded-card bg-brand-dark p-8 text-inverse", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border px-8 py-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-lg font-semibold text-text", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-2 text-sm leading-relaxed text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-8 py-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-4 border-t border-border px-8 py-6", className)}
      {...props}
    />
  );
}
