import { PageHeaderSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <PageSkeleton label="Carregando funil">
      <PageHeaderSkeleton withActions={false} />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, column) => (
          <div key={column} className="w-[248px] shrink-0 rounded border border-border bg-surface">
            <div className="border-b border-border px-3 py-2.5">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 3 - (column % 2) }).map((_, card) => (
                <Skeleton key={card} className="h-[76px] w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}
