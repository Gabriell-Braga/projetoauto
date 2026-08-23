import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneClass = {
    default: "text-ink-900",
    warning: "text-amber-600",
    danger: "text-red-600",
    success: "text-emerald-600",
  }[tone];

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
