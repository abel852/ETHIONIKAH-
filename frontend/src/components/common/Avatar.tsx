"use client";

import { cn, getInitials } from "@/lib/utils";
import { Crown, Gem, ShieldCheck } from "lucide-react";

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "offline" | "away";
  membershipPlan?: "gold" | "platinum" | null;
  isVerified?: boolean;
  showMembershipBadge?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const ringSize = {
  sm: "ring-1",
  md: "ring-2",
  lg: "ring-[3px]",
  xl: "ring-[3px]",
};

const statusColors = {
  online: "bg-green-500",
  offline: "bg-charcoal-300",
  away: "bg-yellow-500",
};

const statusSizes = {
  sm: "w-2.5 h-2.5 border",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
};

const crownSizes = {
  sm: "w-3 h-3 -top-2.5",
  md: "w-3.5 h-3.5 -top-3",
  lg: "w-5 h-5 -top-3.5",
  xl: "w-6 h-6 -top-4",
};

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
  status,
  membershipPlan,
  isVerified,
  showMembershipBadge = true,
}: AvatarProps) {
  const isGold = membershipPlan === "gold";
  const isPlatinum = membershipPlan === "platinum";
  const isPremium = isGold || isPlatinum;

  const membershipRing = isPlatinum
    ? "ring-purple-400 dark:ring-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.45)]"
    : isGold
    ? "ring-amber-400 dark:ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
    : "";

  const fallbackGradient = isPlatinum
    ? "bg-gradient-to-br from-slate-300 via-purple-200 to-slate-400"
    : isGold
    ? "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500"
    : "bg-gold-gradient";

  return (
    <div className={cn("relative inline-flex", className)}>
      {isPremium && showMembershipBadge && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 z-20 drop-shadow-md",
            isPlatinum ? "text-purple-300" : "text-amber-300",
            crownSizes[size]
          )}
        >
          {isPlatinum ? <Gem className="w-full h-full" /> : <Crown className="w-full h-full" />}
        </div>
      )}
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={cn(
            "rounded-full object-cover transition-all",
            sizeMap[size],
            ringSize[size],
            membershipRing,
            isPremium ? "ring-offset-white dark:ring-offset-charcoal-900" : ""
          )}
        />
      ) : (
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-white font-semibold",
            sizeMap[size],
            ringSize[size],
            fallbackGradient,
            membershipRing,
            isPremium ? "ring-offset-white dark:ring-offset-charcoal-900" : ""
          )}
        >
          {getInitials(firstName, lastName)}
        </div>
      )}
      {isVerified && (
        <span
          className={cn(
            "absolute bottom-0 right-0 z-10 rounded-full bg-accent text-white flex items-center justify-center shadow-md",
            size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-5 h-5"
          )}
        >
          <ShieldCheck className="w-full h-full p-[1px]" />
        </span>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-white",
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}

