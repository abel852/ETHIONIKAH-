"use client";

import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  status?: "online" | "offline" | "away";
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
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

export function Avatar({ src, firstName, lastName, size = "md", className, status }: AvatarProps) {
  return (
    <div className={cn("relative inline-flex", className)}>
      {src ? (
        <img
          src={src}
          alt={`${firstName} ${lastName}`}
          className={cn("rounded-full object-cover", sizeMap[size])}
        />
      ) : (
        <div
          className={cn(
            "rounded-full bg-gold-gradient flex items-center justify-center text-white font-semibold",
            sizeMap[size]
          )}
        >
          {getInitials(firstName, lastName)}
        </div>
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
