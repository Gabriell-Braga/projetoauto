import Link from "next/link";
import { cn } from "@/lib/utils";

/** Links em vez de estado: o período fica na URL e sobrevive ao recarregar. */
export function PeriodPicker({ current, options }: { current: number; options: number[] }) {
  return (
    <div className="flex items-center gap-1 rounded border border-border p-0.5">
      {options.map((option) => (
        <Link
          key={option}
          href={`/admin/relatorios?periodo=${option}`}
          aria-current={option === current ? "page" : undefined}
          className={cn(
            "rounded-sm px-2.5 py-1 text-xs transition-colors",
            option === current ? "bg-surface-2 text-text" : "text-muted hover:text-text",
          )}
        >
          {option} dias
        </Link>
      ))}
    </div>
  );
}
