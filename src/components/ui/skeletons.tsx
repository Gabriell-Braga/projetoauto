import { Card, CardHeader } from "./card";
import { Skeleton, SkeletonRegion } from "./skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeletons que espelham o layout real de cada tela — mesma grade, mesma
 * altura de linha, mesmo número de colunas. Nunca um spinner solto na página.
 */

export function PageHeaderSkeleton({ withActions = true }: { withActions?: boolean }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <Skeleton className="h-5 w-52" />
        <Skeleton className="mt-2 h-3 w-72" />
      </div>
      {withActions ? <Skeleton className="h-9 w-32" /> : null}
    </div>
  );
}

/** Cartões de métrica: rótulo curto + número de odômetro. */
export function MetricGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="rounded border border-border bg-surface px-4 py-3.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="mt-3 h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

export function FilterBarSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <Card className="mb-3">
      <div className="flex flex-wrap items-end gap-3 px-4 py-3.5">
        <Skeleton className="h-9 min-w-56 flex-1" />
        {Array.from({ length: fields - 1 }, (_, index) => (
          <Skeleton key={index} className="h-9 w-36" />
        ))}
        <Skeleton className="h-9 w-20" />
      </div>
    </Card>
  );
}

/**
 * Linhas fantasma de tabela.
 * `columns` são larguras proporcionais; `thumb` reserva o quadro da foto.
 */
export function TableSkeleton({
  columns = ["34%", "16%", "14%", "18%", "18%"],
  rows = 8,
  thumb = false,
  title,
}: {
  columns?: string[];
  rows?: number;
  thumb?: boolean;
  /** Reserva a faixa de cabeçalho do card. */
  title?: boolean;
}) {
  return (
    <Card>
      {title ? (
        <CardHeader>
          <Skeleton className="h-3.5 w-40" />
        </CardHeader>
      ) : null}

      <div className="flex h-10 items-center gap-3 border-b border-border bg-surface-2/60 px-3">
        {columns.map((width, index) => (
          <Skeleton key={index} className="h-2.5" style={{ width: `calc(${width} - 12px)` }} />
        ))}
      </div>

      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex h-[var(--row-h)] items-center gap-3 border-b border-border px-3 last:border-0"
        >
          {columns.map((width, columnIndex) => (
            <div
              key={columnIndex}
              className="flex items-center gap-2.5"
              style={{ width: `calc(${width} - 12px)` }}
            >
              {thumb && columnIndex === 0 ? (
                <Skeleton className="h-8 w-11 shrink-0" />
              ) : null}
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      ))}
    </Card>
  );
}

/** Formulário: rótulo de 11px + campo de 36px, na mesma grade da tela real. */
export function FormSkeleton({
  fields = 6,
  columns = 2,
  title = true,
}: {
  fields?: number;
  columns?: 1 | 2 | 3;
  title?: boolean;
}) {
  const grid = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" }[columns];

  return (
    <Card>
      {title ? (
        <CardHeader>
          <Skeleton className="h-3.5 w-36" />
        </CardHeader>
      ) : null}
      <div className={cn("grid gap-x-4 gap-y-4 px-4 py-4", grid)}>
        {Array.from({ length: fields }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="mt-1.5 h-9 w-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Galeria de fotos: grid de quadrados com a mesma proporção do gerenciador. */
export function GallerySkeleton({ count = 8 }: { count?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-3.5 w-20" />
      </CardHeader>
      <div className="px-4 py-4">
        <Skeleton className="mb-4 h-9 w-36" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: count }, (_, index) => (
            <Skeleton key={index} className="aspect-4/3 w-full" />
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Envelope padrão de página em carregamento. */
export function PageSkeleton({
  children,
  label = "Carregando",
}: {
  children: React.ReactNode;
  label?: string;
}) {
  return <SkeletonRegion label={label}>{children}</SkeletonRegion>;
}
