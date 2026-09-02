"use client";

import * as React from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import { checkPassword } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

/**
 * Campo de senha com botão de exibir/ocultar.
 *
 * O botão fica dentro do campo, é alcançável por teclado e anuncia o estado
 * para leitor de tela. `autoComplete` continua chegando ao input para os
 * gerenciadores de senha seguirem funcionando.
 */
export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(
          "h-14 w-full rounded-inner border border-border bg-surface pl-6 pr-14 text-base text-text",
          "transition-colors hover:border-border-strong",
          "focus:border-accent focus:bg-surface focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "aria-[invalid=true]:border-danger",
          className,
        )}
        {...props}
      />

      <button
        type="button"
        aria-label={visible ? "Ocultar senha" : "Exibir senha"}
        aria-pressed={visible}
        title={visible ? "Ocultar senha" : "Exibir senha"}
        onClick={() => setVisible((value) => !value)}
        disabled={props.disabled}
        className={cn(
          "absolute right-1 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-sm",
          "text-faint transition-colors hover:bg-surface-3 hover:text-text",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

/**
 * Lista de requisitos que reage enquanto a pessoa digita.
 * Antes de digitar nada mostra tudo em cinza — não acusa erro de campo vazio.
 */
export function PasswordRequirements({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const checks = checkPassword(value);
  const touched = value.length > 0;

  return (
    <ul
      aria-label="Requisitos da senha"
      className={cn("mt-2 grid gap-1 sm:grid-cols-2", className)}
    >
      {checks.map((check) => (
        <li
          key={check.id}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-colors",
            touched && check.ok ? "text-positive" : "text-faint",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid h-3 w-3 shrink-0 place-items-center rounded-full border",
              touched && check.ok
                ? "border-positive bg-positive text-white"
                : "border-border-strong",
            )}
          >
            {touched && check.ok ? <Check className="h-2 w-2" strokeWidth={4} /> : null}
          </span>
          {check.label}
          <span className="sr-only">{touched && check.ok ? " — atendido" : " — pendente"}</span>
        </li>
      ))}
    </ul>
  );
}

/** Aviso de confirmação divergente, mostrado só depois que a pessoa digitou. */
export function PasswordMatchHint({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  if (!confirmation) return null;
  const matches = password === confirmation;

  return (
    <p
      className={cn("mt-1.5 text-xs", matches ? "text-positive" : "text-danger")}
      role={matches ? undefined : "alert"}
    >
      {matches ? "As senhas conferem." : "As senhas não conferem."}
    </p>
  );
}
