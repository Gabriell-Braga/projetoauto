import { PageHeaderSkeleton, PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando">
      <PageHeaderSkeleton />
      <TableSkeleton title columns={["28%", "20%", "18%", "16%", "18%"]} rows={4} />
    </PageSkeleton>
  );
}
