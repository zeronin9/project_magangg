import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DetailSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-6 lg:p-8 @container">
      {/* Back Button Skeleton */}
      <Skeleton className="h-10 w-48 mb-4" />

      {/* Header Card Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-full @md:w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 @md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Cards Skeleton */}
      {[1, 2].map((section) => (
        <Card key={section}>
          <CardHeader>
            <div className="flex flex-col gap-4 @md:flex-row @md:items-center @md:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-10 w-full @md:w-40" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-12 w-12 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
