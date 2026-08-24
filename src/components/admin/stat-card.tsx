import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  default: "text-text",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-positive",
};

/** Número de destaque em estilo odômetro: display, tabular, grande. */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
  className?: string;
}) {
  return (
    <div
      data-theme-transition
      className={cn("rounded border border-border bg-surface px-4 py-3.5", className)}
    >
      <p className="label-instrument text-muted">{label}</p>
      <p className={cn("odometer mt-2 text-[26px] leading-none", TONE[tone])}>{value}</p>
      {hint ? <p className="mt-2 text-xs text-faint">{hint}</p> : null}
    </div>
  );
}

export function StatGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5", className)}
    >
      {children}
    </div>
  );
}
