"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Seção recolhível, no formato de card.
 *
 * Existe para formulário longo caber na tela sem virar rolagem infinita. A
 * regra que vale aqui: o que é obrigatório nasce aberto; o que é opcional e
 * comprido nasce fechado, mas sempre com um resumo no cabeçalho dizendo o que
 * tem lá dentro — seção fechada sem resumo esconde trabalho, e a pessoa
 * descobre o que faltava só na hora de salvar.
 *
 * O conteúdo continua montado quando fechado: são campos de formulário, e
 * desmontá-los perderia o que foi digitado.
 */
export function Accordion({
  title,
  summary,
  defaultOpen = true,
  badge,
  children,
  className,
}: {
  title: string;
  /** Uma linha dizendo o que a seção contém quando está fechada. */
  summary?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();

  return (
    <section
      data-theme-transition
      className={cn("rounded border border-border bg-surface", className)}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
            open && "border-b border-border",
          )}
        >
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="font-display text-[15px] font-semibold text-text">{title}</span>
            {badge}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {!open && summary ? (
              <span className="hidden text-xs text-muted sm:inline">{summary}</span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-faint transition-transform",
                open && "rotate-180",
              )}
            />
          </span>
        </button>
      </h3>

      <div id={contentId} hidden={!open} className="px-4 py-4">
        {children}
      </div>
    </section>
  );
}
