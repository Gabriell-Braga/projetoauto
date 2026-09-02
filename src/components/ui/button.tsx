import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Spinner } from "./spinner";
import { cn } from "@/lib/utils";

/**
 * Botão em formato pill, conforme a assinatura do sistema.
 *
 * O gap de 16px entre rótulo e ícone e a altura de 52px vêm do documento; os
 * tamanhos menores existem para ações dentro de tabela, onde 52px empurraria
 * a linha para fora de qualquer leitura.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 rounded-full font-medium",
    "whitespace-nowrap transition-colors duration-200 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        // o roxo é a única ação primária do bloco — nunca dois na mesma área
        primary: "bg-accent text-accent-contrast hover:bg-accent-hover",
        secondary: "border border-border bg-surface text-text hover:bg-surface-2",
        ghost: "text-muted hover:bg-surface-2 hover:text-text",
        danger: "bg-danger text-danger-contrast hover:opacity-90",
        outlineDanger: "border border-danger/40 text-danger hover:bg-danger-soft",
      },
      size: {
        sm: "h-8 px-3.5 text-xs gap-1.5",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Mostra o spinner sem alterar a largura do botão. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      ) : null}
      <span className={cn("inline-flex items-center gap-1.5", loading && "invisible")}>
        {children}
      </span>
    </button>
  ),
);
Button.displayName = "Button";

export { buttonVariants };
