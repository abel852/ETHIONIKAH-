"use client";

import { useEffect, useState } from "react";

export function ScreenshotGuard() {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const BLUR_CLASS = "prtsc-blur-active";

    const blur = () => {
      document.documentElement.classList.add(BLUR_CLASS);
      setShowOverlay(true);
    };

    const unblur = () => {
      document.documentElement.classList.remove(BLUR_CLASS);
      setShowOverlay(false);
    };

    const checkKey = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.keyCode === 44 || e.code === "PrintScreen") {
        blur();
      }
    };

    // Blur when window loses focus (clicking another app/window — even in split screen)
    window.addEventListener("blur", blur);

    const onVisibility = () => { if (document.hidden) blur(); };
    document.addEventListener("visibilitychange", onVisibility);

    window.addEventListener("pagehide", blur);

    let prevHeight = window.innerHeight;
    const onResize = () => {
      const dh = prevHeight - window.innerHeight;
      prevHeight = window.innerHeight;
      if (window.innerWidth <= 768 && dh > 60) blur();
    };
    window.addEventListener("resize", onResize);

    document.addEventListener("keydown", checkKey, true);
    document.addEventListener("keyup", checkKey, true);

    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", blur);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", checkKey, true);
      document.removeEventListener("keyup", checkKey, true);
    };
  }, []);

  if (!showOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] cursor-pointer" style={{ pointerEvents: "auto" }}
      onClick={() => {
        document.documentElement.classList.remove("prtsc-blur-active");
        setShowOverlay(false);
      }}
    />
  );
}
