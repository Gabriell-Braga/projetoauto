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
      // overflow-hidden porque o raio de 40px não recorta sozinho: cabeçalho
      // de tabela e fundo de linha em hover pintam retângulos que passam por
      // fora da curva, e o card parece vazar
      className={cn("overflow-hidden rounded-card border border-border bg-surface", className)}
      {...props}
    />
  );
}

/** Card escuro: contraste para destaque, showcase e módulo premium. */
export function CardDark({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-theme-transition
      className={cn("overflow-hidden rounded-card bg-brand-dark p-5 text-inverse", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-border px-5 py-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("font-display text-base font-semibold text-text", className)} {...props} />;
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-xs leading-relaxed text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 border-t border-border px-5 py-4", className)}
      {...props}
    />
  );
}
