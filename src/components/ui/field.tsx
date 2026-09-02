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

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(baseField, "h-14 pr-12", className)} {...props} />
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
