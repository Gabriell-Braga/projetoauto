import { FormSkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando lead">
      <PageHeaderSkeleton withActions={false} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3 rounded border border-border bg-surface p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-3/4" />
        </div>
        <FormSkeleton fields={3} columns={1} />
      </div>
    </PageSkeleton>
  );
}
