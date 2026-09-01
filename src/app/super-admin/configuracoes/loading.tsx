import { FormSkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando configurações">
      <PageHeaderSkeleton withActions={false} />
      <FormSkeleton fields={4} columns={3} />
      <div className="mt-4">
        <FormSkeleton fields={1} columns={1} />
      </div>
    </PageSkeleton>
  );
}
