import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardGridSkeletonProps {
  cards?: number;
}

export function CardGridSkeleton({ cards = 6 }: CardGridSkeletonProps) {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 @md:h-10 @md:w-64" />
          <Skeleton className="h-4 w-72 @md:w-96" />
        </div>
        <Skeleton className="h-10 w-full @md:w-40" />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid gap-4 grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-1">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>

            <CardFooter className="pt-4">
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
