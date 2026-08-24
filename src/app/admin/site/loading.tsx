import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSkeleton, PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando configurações do site">
      <PageHeaderSkeleton />
      <div className="mb-5 flex gap-4 border-b border-border pb-2.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-3.5 w-16" />
          </CardHeader>
          <div className="flex items-center gap-5 px-4 py-4">
            <Skeleton className="h-20 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
        </Card>
        <FormSkeleton fields={6} columns={3} />
      </div>
    </PageSkeleton>
  );
}
