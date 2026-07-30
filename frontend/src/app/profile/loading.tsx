import { ProfileDetailSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="h-7 w-40 bg-charcoal-100 dark:bg-charcoal-700 rounded-lg animate-pulse" />
      <ProfileDetailSkeleton />
    </div>
  );
}
