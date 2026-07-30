import { StatsGridSkeleton, DashboardCardSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
      </div>
      <StatsGridSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    </div>
  );
}
