"use client";

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      containerAriaLabel="Notifications"
      style={{
        zIndex: 999999,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      }}
      toastOptions={{
        className: cn(
          "bg-white dark:bg-charcoal-800 border border-charcoal-100/50 dark:border-charcoal-700 shadow-elevated rounded-xl text-charcoal-900 dark:text-white",
          "font-sans"
        ),
        duration: 4000,
        style: {
          zIndex: 999999,
        },
      }}
    />
  );
}
