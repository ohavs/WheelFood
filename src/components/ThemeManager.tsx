"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";

/**
 * Applies the stored theme + motion preference to <html>.
 * The initial paint is handled by the inline script in layout.tsx so there is
 * no flash before hydration.
 */
export function ThemeManager() {
  const { settings, ready } = useStore();

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      root.dataset.theme = dark ? "dark" : "light";
      root.style.colorScheme = dark ? "dark" : "light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? "#16100d" : "#fff7f0");
    };

    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.reduceMotion = String(settings.reduceMotion);
  }, [settings.reduceMotion, ready]);

  return null;
}
