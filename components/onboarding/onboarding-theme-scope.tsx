"use client";

import { useTheme } from "next-themes";
import type React from "react";
import { useEffect } from "react";

/** next-themes' default localStorage key for the persisted theme choice. */
const THEME_STORAGE_KEY = "theme";

export function OnboardingThemeScope({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.localStorage.getItem(THEME_STORAGE_KEY)) {
      setTheme("light");
    }
  }, [setTheme]);

  return <>{children}</>;
}
