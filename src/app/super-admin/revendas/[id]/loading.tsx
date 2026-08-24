import {
  FormSkeleton,
  MetricGridSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
} from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando revenda">
      <PageHeaderSkeleton />
      <div className="mb-5 flex gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-28" />
      </div>
      <MetricGridSkeleton count={3} />
      <div className="mb-5 flex gap-4 border-b border-border pb-2.5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
      </div>
      <FormSkeleton fields={6} columns={2} />
    </PageSkeleton>
  );
}
