import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Campo do C4MP: 56px de altura, raio interno de 24px, fundo branco.
 *
 * O fundo é a superfície do card, não uma variação cinza: o sistema separa
 * por borda, e um cinza a mais criaria um degrau de superfície que o
 * documento não prevê.
 */
const baseField = [
  "w-full rounded-inner border border-border bg-surface px-6 text-base text-text",
  "transition-colors duration-200 ease-out",
  "hover:border-border-strong",
  "focus:border-accent focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-[invalid=true]:border-danger",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(baseField, "h-14", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(baseField, "min-h-32 resize-y py-4", className)} {...props} />
));
Textarea.displayName = "Textarea";

/**
 * Seta desenhada por nós, recuada 24px como o texto.
 *
 * A seta nativa encosta na borda, e com raio de 24px ela fica visualmente
 * dentro da curva — parece defeito de alinhamento. `appearance-none` tira a
 * nativa e devolve o controle da posição.
 */
const SELECT_ARROW = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, style, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(baseField, "h-14 appearance-none pr-14", className)}
    style={{
      backgroundImage: SELECT_ARROW,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 24px center",
      ...style,
    }}
    {...props}
  />
));
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("label-instrument mb-2 block text-text", className)} {...props} />;
}

export function FormField({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    // rótulo → campo → hint, com 8px entre eles e 24px até o próximo campo
    <div className={cn("mb-6", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-[18px] w-[18px] shrink-0 rounded border-border bg-surface text-accent",
        "accent-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
      {...props}
    />
  );
}
