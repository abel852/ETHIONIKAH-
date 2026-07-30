import { StatsGridSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="h-7 w-48 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
      <StatsGridSkeleton />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-charcoal-800 rounded-xl border border-charcoal-100/50 dark:border-charcoal-700 p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-charcoal-100 dark:bg-charcoal-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-charcoal-100 dark:bg-charcoal-700 rounded animate-pulse" />
              <div className="h-3 w-1/3 bg-charcoal-100 dark:bg-charcoal-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
