import { PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando mensagens">
      <PageHeaderSkeleton />
      <div className="rounded border border-border bg-surface p-4">
        <Skeleton className="mb-4 h-4 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </PageSkeleton>
  );
}
