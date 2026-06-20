"use client";

import {
  IconBell,
  IconBuilding,
  IconCheck,
  IconDeviceCctv,
  IconLoader2,
  IconShieldCheck,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import type { OnboardingToolEvent } from "@/components/onboarding/onboarding-types";
import { cn } from "@/lib/utils";

function iconFor(type: OnboardingToolEvent["type"]) {
  switch (type) {
    case "tool-setOrgName":
      return IconBuilding;
    case "tool-addCamera":
      return IconDeviceCctv;
    case "tool-addDetectionRule":
      return IconShieldCheck;
    case "tool-setAlerts":
      return IconBell;
    default:
      return IconCheck;
  }
}

export function AssemblySequence({
  events,
  busy,
  className,
}: {
  events: OnboardingToolEvent[];
  busy: boolean;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "flex h-dvh items-center justify-center overflow-hidden px-5 py-10",
        className,
      )}
    >
      <div className="w-full max-w-xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-[var(--card)] p-6 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
              <IconLoader2 className={`size-5 ${busy ? "animate-spin" : ""}`} />
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
                Building your workspace
              </h1>
              <p className="text-sm text-[var(--muted-foreground)]">
                Argus is translating your description into cameras, rules, and
                alert settings.
              </p>
            </div>
          </div>

          <div className="min-h-48 space-y-2">
            <AnimatePresence initial={false}>
              {events.map((event) => {
                const Icon = iconFor(event.type);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="flex items-center gap-3 rounded-lg bg-[var(--muted)] px-3.5 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
                      {event.label}
                    </span>
                    <IconCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {events.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex h-36 items-center justify-center rounded-lg bg-[var(--muted)] text-sm text-[var(--muted-foreground)]"
              >
                Waiting for setup actions...
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
