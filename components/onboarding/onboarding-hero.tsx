"use client";

import { IconArrowRight } from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Composer } from "@/components/onboarding/composer";
import { isBusy } from "@/components/onboarding/status";
import { SuggestionCards } from "@/components/onboarding/suggestion-cards";
import { cn } from "@/lib/utils";

interface OnboardingHeroProps {
  input: string;
  status: string;
  onInputChange: (value: string) => void;
  onSubmit: (text: string) => void;
  onManual: () => void;
  className?: string;
}

export function OnboardingHero({
  input,
  status,
  onInputChange,
  onSubmit,
  onManual,
  className,
}: OnboardingHeroProps) {
  const busy = isBusy(status);

  return (
    <main
      className={cn(
        "relative flex h-dvh items-center justify-center overflow-hidden px-5 py-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-[radial-gradient(ellipse_at_bottom,rgba(94,106,210,0.18),rgba(39,166,68,0.08)_42%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_bottom,rgba(130,143,255,0.16),rgba(39,166,68,0.08)_42%,transparent_72%)]" />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-7 text-center"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            Argus setup
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            Describe your space.
          </h1>
          <p className="mx-auto max-w-xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
            Tell Argus what kind of site you run, which areas need cameras, and
            what the AI should flag.
          </p>
        </div>

        <Composer
          input={input}
          busy={busy}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
          sendLabel="Build workspace"
        />

        <SuggestionCards
          onSelect={onSubmit}
          disabled={busy}
          className="sm:grid-cols-3"
        />

        <motion.button
          type="button"
          onClick={onManual}
          whileTap={{ scale: 0.98 }}
          className="inline-flex cursor-pointer items-center gap-1 text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        >
          or set it up manually
          <IconArrowRight className="size-3.5" />
        </motion.button>
      </motion.div>
    </main>
  );
}
