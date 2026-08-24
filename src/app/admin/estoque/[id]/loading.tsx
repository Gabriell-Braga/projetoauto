import { FormSkeleton, GallerySkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando veículo">
      <PageHeaderSkeleton />
      <div className="flex flex-col gap-4">
        <GallerySkeleton count={6} />
        <FormSkeleton fields={6} columns={3} />
      </div>
    </PageSkeleton>
  );
}
