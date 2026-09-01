import { PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando portais">
      <PageHeaderSkeleton withActions={false} />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded border border-border bg-surface p-4">
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="mb-4 h-3 w-full" />
            <Skeleton className="h-8 w-36" />
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
