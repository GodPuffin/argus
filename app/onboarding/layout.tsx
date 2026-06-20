import type { Metadata } from "next";
import type { ReactNode } from "react";
import { OnboardingThemeScope } from "@/components/onboarding/onboarding-theme-scope";

export const metadata: Metadata = {
  title: "Set up Argus",
  description:
    "Configure your AI surveillance workspace with the setup copilot.",
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground antialiased">
      <OnboardingThemeScope>{children}</OnboardingThemeScope>
    </div>
  );
}
