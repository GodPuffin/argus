import type { Severity } from "@/lib/demo/session-store";

export type OnboardingPhase = "hero" | "assembling" | "review" | "confirm";

/**
 * Single source of truth for the onboarding tool-call types. The runtime set
 * (`ONBOARDING_TOOL_TYPES` in constants.ts) is derived from this tuple, and the
 * `OnboardingToolType` union below is derived from it too — so the literal list
 * is maintained in exactly one place.
 */
export const ONBOARDING_TOOL_TYPE_TUPLE = [
  "tool-setOrgName",
  "tool-addCamera",
  "tool-addDetectionRule",
  "tool-setAlerts",
  "tool-completeOnboarding",
] as const;

export type OnboardingToolType = (typeof ONBOARDING_TOOL_TYPE_TUPLE)[number];

/**
 * Tool output payloads, one interface per tool type. These mirror the input
 * shapes consumed by the session-store mutators.
 */
export interface SetOrgNameOutput {
  name?: string;
}

export interface AddCameraOutput {
  name?: string;
  location?: string;
}

export interface AddDetectionRuleOutput {
  label?: string;
  description?: string;
  severity?: Severity;
}

export interface SetAlertsOutput {
  channels?: Array<"dashboard" | "email" | "sms">;
  severityThreshold?: Severity;
  email?: string;
  phone?: string;
}

export interface CompleteOnboardingOutput {
  confirm?: boolean;
}

/**
 * Maps each tool type to its output payload. The discriminated unions below are
 * derived from this map so the literal type → payload pairing lives in one place
 * and narrowing on `type` gives the exact payload (no weak intersection, so no
 * spurious `o?.field` optional chaining is forced on consumers).
 */
export interface OnboardingToolOutputMap {
  "tool-setOrgName": SetOrgNameOutput;
  "tool-addCamera": AddCameraOutput;
  "tool-addDetectionRule": AddDetectionRuleOutput;
  "tool-setAlerts": SetAlertsOutput;
  "tool-completeOnboarding": CompleteOnboardingOutput;
}

/** Union of every tool output payload, for code that handles a raw payload. */
export type OnboardingToolOutput =
  OnboardingToolOutputMap[keyof OnboardingToolOutputMap];

/**
 * A discovered tool call: a discriminated union over `type` where each member
 * carries the matching output payload, so `switch (event.type)` narrows
 * `event.output` to the exact shape.
 */
export type OnboardingToolEvent = {
  [K in OnboardingToolType]: {
    id: string;
    type: K;
    output: OnboardingToolOutputMap[K];
    label: string;
  };
}[OnboardingToolType];

/** A streamed text part of an assistant message. */
export interface TextPart {
  type: "text";
  text: string;
}

/** A streamed tool-call part of an assistant message. */
export interface ToolPart {
  type: string;
  state?:
    | "input-streaming"
    | "input-available"
    | "output-available"
    | "output-error";
  toolCallId?: string;
  output?: OnboardingToolOutput;
}
