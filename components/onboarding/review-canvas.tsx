"use client";

import {
  IconBell,
  IconBuilding,
  IconDeviceCctv,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { sectionCompletion } from "@/components/onboarding/completion";
import {
  AlertsSection,
  CamerasSection,
  OrgSection,
  RulesSection,
} from "@/components/onboarding/onboarding-sections";
import { Button } from "@/components/ui/button";
import type { DemoSessionState } from "@/lib/demo/session-store";
import { cn } from "@/lib/utils";

const MARKERS = [
  {
    label: "Organization",
    icon: IconBuilding,
    barClass: "bg-slate-500",
    iconClass: "text-slate-600 dark:text-slate-300",
  },
  {
    label: "Cameras",
    icon: IconDeviceCctv,
    barClass: "bg-blue-500",
    iconClass: "text-blue-600 dark:text-blue-300",
  },
  {
    label: "Detection",
    icon: IconShieldCheck,
    barClass: "bg-emerald-500",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  {
    label: "Alerts",
    icon: IconBell,
    barClass: "bg-amber-500",
    iconClass: "text-amber-600 dark:text-amber-300",
  },
];

export function ReviewCanvas({
  session,
  onConfirm,
  className,
}: {
  session: DemoSessionState;
  onConfirm: () => void;
  className?: string;
}) {
  const done = sectionCompletion(session);
  const completed = done.filter(Boolean).length;

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-7 pb-24 lg:px-8",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Review your workspace
            </h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              Everything is editable before launch.
            </p>
          </div>
          <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
            {completed}/{done.length} complete
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MARKERS.map((marker, index) => (
            <motion.div
              key={marker.label}
              layout
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="min-w-0"
            >
              <div
                className={`h-1 rounded-full ${
                  done[index] ? marker.barClass : "bg-[var(--muted)]"
                }`}
              />
              <div className="mt-2 flex items-center gap-1.5">
                <marker.icon
                  className={`size-3.5 ${
                    done[index]
                      ? marker.iconClass
                      : "text-[var(--muted-foreground)]"
                  }`}
                />
                <span
                  className={`truncate text-xs ${
                    done[index]
                      ? "text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)]"
                  }`}
                >
                  {marker.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <OrgSection name={session.orgName} done={done[0]} />
        <CamerasSection cameras={session.cameras} done={done[1]} />
        <RulesSection rules={session.detectionRules} done={done[2]} />
        <AlertsSection prefs={session.alertPrefs} done={done[3]} />
      </div>

      <div className="sticky bottom-0 -mx-5 bg-[var(--background)]/90 px-5 py-4 backdrop-blur lg:-mx-8 lg:px-8">
        <Button
          asChild
          className="h-auto w-full cursor-pointer bg-slate-900 px-4 py-2.5 text-white shadow-sm hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
        >
          <motion.button
            type="button"
            onClick={onConfirm}
            whileTap={{ scale: 0.99 }}
          >
            Continue to launch
          </motion.button>
        </Button>
      </div>
    </div>
  );
}
