import type {
  OnboardingToolOutput,
  OnboardingToolOutputMap,
  OnboardingToolType,
} from "@/components/onboarding/onboarding-types";
import { ONBOARDING_TOOL_TYPE_TUPLE } from "@/components/onboarding/onboarding-types";

/** Runtime set of recognised tool-call types, derived from the shared tuple. */
export const ONBOARDING_TOOL_TYPES = new Set<OnboardingToolType>(
  ONBOARDING_TOOL_TYPE_TUPLE,
);

export function isOnboardingToolType(type: string): type is OnboardingToolType {
  return ONBOARDING_TOOL_TYPES.has(type as OnboardingToolType);
}

/**
 * Human-readable summaries of a completed tool call. Typed per tool so each
 * label receives exactly its own output payload (no weak intersection).
 */
type ToolLabelMap = {
  [K in OnboardingToolType]: (output: OnboardingToolOutputMap[K]) => string;
};

export const TOOL_LABELS: ToolLabelMap = {
  "tool-setOrgName": (o) => `Named your workspace "${o.name ?? ""}"`,
  "tool-addCamera": (o) =>
    `Added camera: ${o.name ?? "Camera"}${o.location ? ` - ${o.location}` : ""}`,
  "tool-addDetectionRule": (o) => `Enabled rule: ${o.label ?? "Detection"}`,
  "tool-setAlerts": (o) =>
    `Set alerts: ${(o.channels ?? []).join(", ") || "dashboard"}`,
  "tool-completeOnboarding": () => "Finished setup",
};

const DEFAULT_TOOL_LABEL = "Updated setup";

/**
 * Resolve the human-readable label for a tool call given its runtime `type` and
 * raw output. Falls back to a generic label for unrecognised types. Centralises
 * the type → payload narrowing the streamed (loosely-typed) output can't express.
 */
export function toolLabel(
  type: string,
  output: OnboardingToolOutput | undefined,
): string {
  if (!isOnboardingToolType(type)) return DEFAULT_TOOL_LABEL;
  const label = TOOL_LABELS[type] as (o: OnboardingToolOutput) => string;
  return label(output ?? {});
}

/** Short titles for the tool header in the copilot transcript. */
export const TOOL_TITLES: Record<string, string> = {
  "tool-setOrgName": "Set workspace name",
  "tool-addCamera": "Add camera",
  "tool-addDetectionRule": "Add detection rule",
  "tool-setAlerts": "Configure alerts",
  "tool-completeOnboarding": "Complete onboarding",
};

/**
 * Shared class for the filled (muted-background) text inputs used across the
 * onboarding sections and editable lists. Kept here so the single style lives in
 * one place; the project's `Input`/`Textarea` use a bordered/transparent style
 * that doesn't match this filled treatment, so this is intentionally separate.
 */
export const ONBOARDING_INPUT_CLASS =
  "w-full rounded-md bg-[var(--muted)] px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-1 ring-black/5 transition-shadow placeholder:text-[var(--muted-foreground)] focus:ring-[var(--ring)] dark:ring-white/10";

/** Example prompts offered on the hero and empty copilot panel. */
export const SUGGESTIONS = [
  "3-story office - watch the lobby and parking, flag weapons and medical emergencies",
  "Retail store, cover the entrance and stockroom, alert me about theft and loitering",
  "Warehouse with a loading dock and perimeter - detect unauthorized access and safety issues",
];
