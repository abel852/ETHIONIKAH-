"use client";

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: cn(
          "bg-white border border-charcoal-100/50 shadow-elevated rounded-xl text-charcoal-900",
          "font-sans"
        ),
        duration: 4000,
      }}
    />
  );
}
