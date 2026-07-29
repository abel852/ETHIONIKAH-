"use client";

import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

export function ToastProvider() {
  return (
    <>
      <style>{`
        @keyframes toast-checkmark {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(0deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes toast-x-mark {
          0% { transform: scale(0) rotate(45deg); opacity: 0; }
          30% { transform: scale(1.4) rotate(45deg); opacity: 1; }
          60% { transform: scale(0.9) rotate(45deg); }
          100% { transform: scale(1) rotate(45deg); opacity: 1; }
        }
        @keyframes toast-x-line-1 {
          0% { width: 0; opacity: 0; }
          100% { width: 20px; opacity: 1; }
        }
        @keyframes toast-x-line-2 {
          0%, 40% { width: 0; opacity: 0; }
          100% { width: 20px; opacity: 1; }
        }
        @keyframes toast-check-circle {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes toast-error-circle {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .toast-success-icon {
          animation: toast-check-circle 0.3s ease-out forwards;
        }
        .toast-success-check {
          animation: toast-checkmark 0.4s ease-out 0.1s forwards;
          transform: scale(0);
          opacity: 0;
        }
        .toast-error-icon {
          animation: toast-error-circle 0.3s ease-out forwards;
        }
        .toast-error-x {
          animation: toast-x-mark 0.4s ease-out 0.1s forwards;
          transform: scale(0);
          opacity: 0;
        }
      `}</style>
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
        icons={{
          success: (
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="toast-success-icon absolute inset-0 rounded-full bg-green-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" className="toast-success-check" style={{ transformOrigin: "center" }} />
                </svg>
              </div>
            </div>
          ),
          error: (
            <div className="relative w-5 h-5 flex items-center justify-center">
              <div className="toast-error-icon absolute inset-0 rounded-full bg-red-500 flex items-center justify-center">
                <div className="toast-error-x relative w-3 h-3">
                  <div className="absolute top-1/2 left-0 h-[2.5px] w-full bg-white rounded-full -translate-y-1/2" style={{ animation: "toast-x-line-1 0.3s ease-out 0.15s forwards", width: 0, opacity: 0 }} />
                  <div className="absolute left-1/2 top-0 w-[2.5px] h-full bg-white rounded-full -translate-x-1/2" style={{ animation: "toast-x-line-2 0.3s ease-out 0.25s forwards", height: 0, opacity: 0 }} />
                </div>
              </div>
            </div>
          ),
        }}
      />
    </>
  );
}
