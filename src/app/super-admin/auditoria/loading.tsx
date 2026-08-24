import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando auditoria">
      <PageHeaderSkeleton withActions={false} />
      <FilterBarSkeleton fields={2} />
      <TableSkeleton columns={["16%", "22%", "20%", "18%", "24%"]} rows={10} />
    </PageSkeleton>
  );
}
