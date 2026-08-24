import { MetricGridSkeleton, PageHeaderSkeleton, PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando visão geral">
      <PageHeaderSkeleton />
      <MetricGridSkeleton count={5} />
      <TableSkeleton title columns={["34%", "18%", "18%", "15%", "15%"]} rows={8} />
    </PageSkeleton>
  );
}
