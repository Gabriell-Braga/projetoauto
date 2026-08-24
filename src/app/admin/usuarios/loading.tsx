import { FormSkeleton, PageHeaderSkeleton, PageSkeleton, TableSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando usuários">
      <PageHeaderSkeleton withActions={false} />
      <TableSkeleton title columns={["32%", "18%", "22%", "18%", "10%"]} rows={4} />
      <div className="mt-4">
        <FormSkeleton fields={4} columns={2} />
      </div>
    </PageSkeleton>
  );
}
