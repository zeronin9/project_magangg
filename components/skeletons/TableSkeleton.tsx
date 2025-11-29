import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  rows?: number;
  showSearch?: boolean;
  showButton?: boolean;
}

export function TableSkeleton({ rows = 5, showSearch = true, showButton = true }: TableSkeletonProps) {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-end @md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 @md:h-10 @md:w-64" />
          <Skeleton className="h-4 w-72 @md:w-96" />
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            {showSearch && (
              <Skeleton className="h-10 w-full @md:w-80" />
            )}
            {showButton && (
              <Skeleton className="h-10 w-full @md:w-48" />
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Desktop Table Skeleton */}
          <div className="hidden @md:block space-y-4">
            {/* Table Header */}
            <div className="flex gap-4 pb-4 border-b">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>

            {/* Table Rows */}
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>

          {/* Mobile Card Skeleton */}
          <div className="@md:hidden space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
