"use client";

import { useLayoutEffect } from "react";

export function ThemeInit() {
  useLayoutEffect(() => {
    try {
      const a = localStorage.getItem("admin-dark-mode");
      if (a === "true") {
        document.documentElement.classList.add("dark");
        return;
      }
      const t = localStorage.getItem("ethio-nikah-theme");
      if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme:dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
