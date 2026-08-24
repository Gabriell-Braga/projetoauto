import { cn } from "@/lib/utils";

/**
 * Bloco fantasma do design system.
 * Pulso de opacidade (1.5s), sem gradiente deslizante, radius 6px e
 * cor em --surface-2 — funciona igual nos dois temas.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("shimmer rounded bg-surface-2", className)}
      style={style}
    />
  );
}

/** Envelope de qualquer região em carregamento: marca aria-busy para leitores de tela. */
export function SkeletonRegion({
  label = "Carregando",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

/** Texto fantasma com largura variável, para parecer conteúdo real. */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["100%", "82%", "91%", "74%", "88%"];
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className="h-3" style={{ width: widths[index % widths.length] }} />
      ))}
    </div>
  );
}
