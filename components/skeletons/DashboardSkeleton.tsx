import CardSkeleton from "./CardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="h-6 w-96 mb-2" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border-2 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-[335px] w-full" />
      </div>
    </div>
  );
}
