"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

export function ScreenshotGuard() {
  const { user } = useAuth();
  const [showOverlay, setShowOverlay] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build watermark text from user info
  const watermarkText = user
    ? `${user.firstName} ${user.lastName?.[0] || ""} • ${user.id.slice(0, 8)} • ETHIONIKAH`
    : "ETHIONIKAH • Protected";

  useEffect(() => {
    // Only activate screenshot protection when user is logged in
    if (!user) return;

    const BLUR_CLASS = "prtsc-blur-active";

    const blur = () => {
      document.documentElement.classList.add(BLUR_CLASS);
      setShowOverlay(true);
      // Also flash watermark on any blur event
      setShowWatermark(true);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      blurTimerRef.current = setTimeout(() => setShowWatermark(false), 3000);
    };

    const unblur = () => {
      document.documentElement.classList.remove(BLUR_CLASS);
      setShowOverlay(false);
    };

    const checkKey = (e: KeyboardEvent) => {
      // PrintScreen key (desktop)
      if (e.key === "PrintScreen" || e.keyCode === 44 || e.code === "PrintScreen") {
        blur();
      }
      // Windows Snipping Tool: Win+Shift+S
      if (e.shiftKey && (e.metaKey || e.key === "Meta") && (e.key === "s" || e.key === "S")) {
        blur();
      }
      // macOS screenshot combos: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5
      if (e.shiftKey && e.metaKey && ["3", "4", "5"].includes(e.key)) {
        blur();
      }
    };

    // Blur when window loses focus — catches many mobile screenshot tools
    // and desktop app switching. Use a small delay to avoid false positives
    // from button clicks and form submissions.
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    const onWindowBlur = () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => blur(), 200);
    };
    const onWindowFocus = () => {
      if (blurTimeout) { clearTimeout(blurTimeout); blurTimeout = null; }
    };
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    // Visibility change — tab switch, app switch on mobile
    const onVisibility = () => { if (document.hidden) blur(); };
    document.addEventListener("visibilitychange", onVisibility);

    // Page hide — navigating away
    window.addEventListener("pagehide", blur);

    // Mobile: detect screenshot via resize (some Android devices trigger
    // a brief resize when screenshot notification bar appears)
    let prevHeight = window.innerHeight;
    let prevWidth = window.innerWidth;
    const onResize = () => {
      const dh = prevHeight - window.innerHeight;
      const dw = Math.abs(prevWidth - window.innerWidth);
      prevHeight = window.innerHeight;
      prevWidth = window.innerWidth;
      // Mobile screenshot often causes a small height change or width change
      if (window.innerWidth <= 1024 && (dh > 40 || dw > 40)) blur();
    };
    window.addEventListener("resize", onResize);

    // Mobile: orientation change can sometimes be triggered by screenshot UI
    const onOrientation = () => { blur(); };
    window.addEventListener("orientationchange", onOrientation);

    // Keyboard events
    document.addEventListener("keydown", checkKey, true);
    document.addEventListener("keyup", checkKey, true);

    // Touch events: some Android screenshot tools trigger a brief touch
    let lastTouchTime = 0;
    const onTouchStart = () => { lastTouchTime = Date.now(); };
    document.addEventListener("touchstart", onTouchStart, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", blur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("keydown", checkKey, true);
      document.removeEventListener("keyup", checkKey, true);
      document.removeEventListener("touchstart", onTouchStart);
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, [user]);

  return (
    <>
      {/* Blur overlay — click to dismiss */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-[99999] cursor-pointer bg-white/80 dark:bg-charcoal-900/80 flex items-center justify-center"
          style={{ pointerEvents: "auto" }}
          onClick={() => {
            document.documentElement.classList.remove("prtsc-blur-active");
            setShowOverlay(false);
          }}
        >
          <div className="text-center px-6">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-sm font-semibold text-charcoal-700 dark:text-charcoal-200">
              Screenshot detected — content hidden
            </p>
            <p className="text-xs text-charcoal-400 mt-1">Tap to return</p>
          </div>
        </div>
      )}

      {/* Watermark overlay — always visible on sensitive content, identifies the user */}
      {showWatermark && user && (
        <div
          className="fixed inset-0 z-[99998] pointer-events-none flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="text-[10px] sm:text-xs font-medium text-charcoal-300/40 dark:text-white/20 select-none whitespace-nowrap"
            style={{
              transform: "rotate(-30deg)",
              filter: "blur(0.3px)",
            }}
          >
            {watermarkText}
          </div>
        </div>
      )}
    </>
  );
}
