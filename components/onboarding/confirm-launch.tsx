"use client";

import {
  IconArrowRight,
  IconBell,
  IconDeviceCctv,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import type React from "react";
import { Button } from "@/components/ui/button";
import type { DemoSessionState } from "@/lib/demo/session-store";
import { cn } from "@/lib/utils";

export function ConfirmLaunch({
  session,
  finishing,
  onBack,
  onLaunch,
  className,
}: {
  session: DemoSessionState;
  finishing: boolean;
  onBack: () => void;
  onLaunch: () => void;
  className?: string;
}) {
  const alertChannels = session.alertPrefs.channels.join(", ") || "dashboard";

  return (
    <main
      className={cn(
        "flex min-h-[calc(100dvh-49px)] items-center justify-center px-5 py-8",
        className,
      )}
    >
      <section className="w-full max-w-2xl rounded-xl bg-[var(--card)] p-6 shadow-xl shadow-black/10 ring-1 ring-black/5 dark:shadow-black/30 dark:ring-white/10">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Confirm launch
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            {session.orgName ?? "Your workspace"} is ready.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            Argus will open the live dashboard with your session cameras merged
            into the demo workspace.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SummaryTile
            icon={IconDeviceCctv}
            label="Cameras"
            value={`${session.cameras.length}`}
          />
          <SummaryTile
            icon={IconShieldCheck}
            label="Rules"
            value={`${session.detectionRules.length}`}
          />
          <SummaryTile icon={IconBell} label="Alerts" value={alertChannels} />
        </div>

        <div className="mt-6 rounded-lg bg-[var(--muted)] p-4">
          <h2 className="text-sm font-medium text-[var(--foreground)]">
            Launch summary
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--muted-foreground)]">
            <li>Organization: {session.orgName ?? "Unnamed workspace"}</li>
            <li>
              Cameras:{" "}
              {session.cameras.length
                ? session.cameras.map((camera) => camera.camera_name).join(", ")
                : "none yet"}
            </li>
            <li>
              Rules:{" "}
              {session.detectionRules.length
                ? session.detectionRules.map((rule) => rule.label).join(", ")
                : "none yet"}
            </li>
            <li>
              Alerts: {alertChannels}, {session.alertPrefs.severityThreshold}+
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <motion.button
            type="button"
            onClick={onBack}
            disabled={finishing}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-md bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--accent)] disabled:opacity-50"
          >
            Back to review
          </motion.button>
          <Button
            asChild
            className="h-auto cursor-pointer bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            <motion.button
              type="button"
              onClick={onLaunch}
              disabled={finishing}
              whileTap={{ scale: 0.98 }}
            >
              Launch workspace
              <IconArrowRight className="size-4" />
            </motion.button>
          </Button>
        </div>
      </section>
    </main>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-lg bg-[var(--muted)] p-4"
    >
      <Icon className="mb-3 size-4 text-slate-600 dark:text-slate-300" />
      <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-[var(--foreground)]">
        {value}
      </p>
    </motion.div>
  );
}
