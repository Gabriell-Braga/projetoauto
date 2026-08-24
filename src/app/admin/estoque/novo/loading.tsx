import { FormSkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando formulário">
      <PageHeaderSkeleton withActions={false} />
      <div className="flex flex-col gap-4">
        <FormSkeleton fields={6} columns={3} />
        <FormSkeleton fields={3} columns={3} />
      </div>
    </PageSkeleton>
  );
}
