import {
  FilterBarSkeleton,
  MetricGridSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando estoque">
      <PageHeaderSkeleton />
      <MetricGridSkeleton count={5} />
      <FilterBarSkeleton fields={3} />
      <TableSkeleton
        thumb
        columns={["30%", "12%", "10%", "15%", "13%", "8%", "12%"]}
        rows={10}
      />
    </PageSkeleton>
  );
}
