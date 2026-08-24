import {
  FormSkeleton,
  PageHeaderSkeleton,
  PageSkeleton,
  TableSkeleton,
} from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando usuários">
      <PageHeaderSkeleton withActions={false} />
      <TableSkeleton title columns={["36%", "20%", "24%", "20%"]} rows={4} />
      <div className="mt-4">
        <FormSkeleton fields={3} columns={3} />
      </div>
    </PageSkeleton>
  );
}
