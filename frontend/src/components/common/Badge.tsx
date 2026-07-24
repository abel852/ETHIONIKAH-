"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "gold" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

const variants = {
  default: "bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-700 dark:text-charcoal-300",
  gold: "bg-accent/15 text-accent-dark",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
};

export function Badge({ variant = "default", size = "sm", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold rounded-full",
      "bg-gradient-to-r from-accent to-yellow-500 text-white",
      "shadow-lg shadow-accent/30",
      "ring-1 ring-accent/50",
      className
    )}>
      <svg className="w-3.5 h-3.5 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
      </svg>
      Verified
    </span>
  );
}

export function NotVerifiedBadge({ className }: { className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full",
      "bg-charcoal-100 dark:bg-charcoal-700 text-charcoal-400 dark:text-charcoal-500",
      className
    )}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 102 0V6zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
      Not Verified
    </span>
  );
}
