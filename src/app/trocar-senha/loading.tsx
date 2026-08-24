import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <SkeletonRegion label="Carregando" className="w-full max-w-[380px]">
        <Card className="p-6">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-2.5 h-5 w-44" />
          <Skeleton className="mt-2 h-3 w-64" />
          <div className="mt-6 flex flex-col gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index}>
                <Skeleton className="h-2.5 w-28" />
                <Skeleton className="mt-1.5 h-9 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </SkeletonRegion>
    </main>
  );
}
