import { ConversationListSkeleton, MessageListSkeleton } from "@/components/common";

export default function Loading() {
  return (
    <div className="flex h-screen">
      {/* Conversation list skeleton */}
      <div className="w-full max-w-xs border-r border-charcoal-100 dark:border-charcoal-700 hidden lg:block">
        <div className="p-4 space-y-2">
          <div className="h-5 w-24 bg-charcoal-100 dark:bg-charcoal-700 rounded animate-pulse" />
        </div>
        <ConversationListSkeleton />
      </div>
      {/* Message area skeleton */}
      <div className="flex-1">
        <MessageListSkeleton />
      </div>
    </div>
  );
}
