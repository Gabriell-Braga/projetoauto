import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MetricGridSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando visão geral">
      <PageHeaderSkeleton />
      <MetricGridSkeleton count={5} />
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <TableSkeleton title columns={["32%", "30%", "20%", "18%"]} rows={5} />
        <Card>
          <CardHeader>
            <Skeleton className="h-3.5 w-32" />
          </CardHeader>
          <div className="px-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
          </div>
        </Card>
      </div>
    </PageSkeleton>
  );
}
