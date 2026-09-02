import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tabela do sistema: cabeçalho com fundo sutil, linhas limpas, bordas
 * discretas e números tabulares nas colunas de valor.
 *
 * Rola na horizontal no celular em vez de quebrar — converter linha em card
 * exigiria decidir o que cabe, e isso muda por tabela.
 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function Thead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn("border-b border-border bg-surface-2/60 text-left text-muted", className)}
      {...props}
    />
  );
}

export function Th({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "label-instrument whitespace-nowrap px-4 py-2.5 font-medium",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 transition-colors hover:bg-surface-2/50",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "h-[var(--row-h)] px-4 py-2.5 align-middle text-text",
        numeric && "text-right tnum",
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="font-display text-base font-semibold text-text">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
