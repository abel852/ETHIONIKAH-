export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
        <div className="h-4 w-32 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-charcoal-800 rounded-2xl shadow-sm border border-charcoal-100/50 dark:border-charcoal-700 overflow-hidden">
            <div className="h-40 bg-charcoal-100 dark:bg-charcoal-700 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-charcoal-100 dark:bg-charcoal-700 rounded w-2/3 animate-pulse" />
              <div className="h-3 bg-charcoal-100 dark:bg-charcoal-700 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
