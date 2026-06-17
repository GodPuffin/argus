"use client";

import {
  IconBell,
  IconBuilding,
  IconCheck,
  IconDeviceCctv,
  IconShieldCheck,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import type React from "react";
import { ONBOARDING_INPUT_CLASS } from "@/components/onboarding/constants";
import { EditableList } from "@/components/onboarding/editable-list";
import type { DemoSessionState, Severity } from "@/lib/demo/session-store";
import {
  addCamera,
  addDetectionRule,
  removeCamera,
  removeDetectionRule,
  setAlerts,
  setOrgName,
} from "@/lib/demo/session-store";

type IconComponent = React.ComponentType<{ className?: string }>;
type Tone = "slate" | "blue" | "emerald" | "amber" | "rose";

const TONE_CLASS: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300",
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300",
};

const SEVERITY_DOT: Record<Severity, string> = {
  High: "bg-red-400",
  Medium: "bg-amber-400",
  Minor: "bg-[var(--muted-foreground)]",
};

const CHANNELS: Array<{ key: "dashboard" | "email" | "sms"; label: string }> = [
  { key: "dashboard", label: "Dashboard" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

function Section({
  icon: Icon,
  title,
  description,
  done,
  tone,
  children,
}: {
  icon: IconComponent;
  title: string;
  description: string;
  done: boolean;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="rounded-lg bg-[var(--card)] p-5 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
    >
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-7 items-center justify-center rounded-md ${
            done
              ? TONE_CLASS[tone]
              : "bg-[var(--muted)] text-[var(--muted-foreground)]"
          }`}
        >
          {done ? (
            <IconCheck className="size-4" />
          ) : (
            <Icon className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-[var(--foreground)]">
            {title}
          </h2>
          <p className="text-xs text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

export function OrgSection({
  name,
  done,
}: {
  name: string | null;
  done: boolean;
}) {
  return (
    <Section
      icon={IconBuilding}
      title="Organization"
      description="What should we call this deployment?"
      done={done}
      tone="slate"
    >
      <input
        value={name ?? ""}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="e.g. Office HQ"
        className={ONBOARDING_INPUT_CLASS}
      />
    </Section>
  );
}

export function CamerasSection({
  cameras,
  done,
}: {
  cameras: DemoSessionState["cameras"];
  done: boolean;
}) {
  return (
    <Section
      icon={IconDeviceCctv}
      title="Cameras"
      description="Add the areas you want to monitor."
      done={done}
      tone="blue"
    >
      <EditableList
        items={cameras}
        onAdd={(name) => addCamera({ name })}
        onRemove={removeCamera}
        removeLabel={(c) => `Remove ${c.camera_name}`}
        placeholder="Add a camera (e.g. Lobby)"
        renderItem={(c) => (
          <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--foreground)]">
            <span className="size-1.5 shrink-0 rounded-full bg-blue-500" />
            <span className="truncate">{c.camera_name}</span>
          </span>
        )}
      />
    </Section>
  );
}

export function RulesSection({
  rules,
  done,
}: {
  rules: DemoSessionState["detectionRules"];
  done: boolean;
}) {
  return (
    <Section
      icon={IconShieldCheck}
      title="Detection rules"
      description="What should the AI flag?"
      done={done}
      tone="emerald"
    >
      <EditableList
        items={rules}
        onAdd={(label) => addDetectionRule({ label })}
        onRemove={removeDetectionRule}
        removeLabel={(r) => `Remove ${r.label}`}
        placeholder="Add a rule (e.g. Weapons)"
        renderItem={(r) => (
          <span className="flex min-w-0 items-center gap-2 text-sm text-[var(--foreground)]">
            <span
              className={`size-1.5 shrink-0 rounded-full ${SEVERITY_DOT[r.severity]}`}
            />
            <span className="truncate">{r.label}</span>
            {r.description && (
              <span className="hidden truncate text-xs text-[var(--muted-foreground)] sm:inline">
                - {r.description}
              </span>
            )}
          </span>
        )}
      />
    </Section>
  );
}

export function AlertsSection({
  prefs,
  done,
}: {
  prefs: DemoSessionState["alertPrefs"];
  done: boolean;
}) {
  const toggleChannel = (key: "dashboard" | "email" | "sms") => {
    const has = prefs.channels.includes(key);
    const channels = has
      ? prefs.channels.filter((c) => c !== key)
      : [...prefs.channels, key];
    setAlerts({ channels });
  };
  const severities: Severity[] = ["Minor", "Medium", "High"];

  return (
    <Section
      icon={IconBell}
      title="Alerts"
      description="How and when should we notify you?"
      done={done}
      tone="amber"
    >
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            Channels
          </p>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.map((ch) => {
              const active = prefs.channels.includes(ch.key);
              return (
                <motion.button
                  key={ch.key}
                  type="button"
                  onClick={() => toggleChannel(ch.key)}
                  whileTap={{ scale: 0.97 }}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-transparent bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
                      : "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {ch.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs text-[var(--muted-foreground)]">
            Minimum severity
          </p>
          <div className="flex flex-wrap gap-2">
            {severities.map((sev) => {
              const active = prefs.severityThreshold === sev;
              return (
                <motion.button
                  key={sev}
                  type="button"
                  onClick={() => setAlerts({ severityThreshold: sev })}
                  whileTap={{ scale: 0.97 }}
                  className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    active
                      ? "border-transparent bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
                      : "border-transparent bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {sev}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </Section>
  );
}
