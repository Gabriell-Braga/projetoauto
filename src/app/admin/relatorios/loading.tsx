import { MetricGridSkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando relatórios">
      <PageHeaderSkeleton />
      <MetricGridSkeleton count={5} />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded border border-border bg-surface p-4">
            <Skeleton className="mb-4 h-4 w-40" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, row) => (
                <Skeleton key={row} className="h-6 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
