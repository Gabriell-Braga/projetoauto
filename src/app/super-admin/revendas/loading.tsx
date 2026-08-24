import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando revendas">
      <PageHeaderSkeleton />
      <FilterBarSkeleton fields={3} />
      <TableSkeleton columns={["26%", "12%", "13%", "15%", "14%", "12%", "8%"]} rows={10} />
    </PageSkeleton>
  );
}
