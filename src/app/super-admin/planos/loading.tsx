import { PageHeaderSkeleton, PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando planos">
      <PageHeaderSkeleton />
      <TableSkeleton title columns={["24%", "12%", "12%", "10%", "14%", "10%", "10%", "8%"]} rows={4} />
      <div className="mt-4">
        <TableSkeleton title columns={["24%", "14%", "12%", "12%", "18%", "12%", "8%"]} rows={2} />
      </div>
    </PageSkeleton>
  );
}
