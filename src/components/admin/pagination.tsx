import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Paginação discreta e uniforme em todas as listagens. */
export function Pagination({
  basePath,
  page,
  total,
  pageSize,
  params = {},
}: {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
  params?: Record<string, string | number | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function href(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value));
    }
    query.set("page", String(target));
    return `${basePath}?${query.toString()}`;
  }

  const step = "flex h-7 items-center gap-1 rounded border border-border px-2 transition-colors";

  return (
    <nav
      aria-label="Paginação"
      className="mt-3 flex items-center justify-between gap-3 text-[13px]"
    >
      <span className="label-instrument text-faint">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
      </span>

      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={cn(step, "text-muted hover:bg-surface-2 hover:text-text")}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </Link>
        ) : (
          <span className={cn(step, "text-faint opacity-50")} aria-disabled="true">
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </span>
        )}

        <span className="label-instrument tnum text-muted">
          {page} / {totalPages}
        </span>

        {page < totalPages ? (
          <Link href={href(page + 1)} className={cn(step, "text-muted hover:bg-surface-2 hover:text-text")}>
            Próxima
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className={cn(step, "text-faint opacity-50")} aria-disabled="true">
            Próxima
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </nav>
  );
}
