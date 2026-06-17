/**
 * Shared domain types for the demo-session overlay. This module is the single
 * source of truth; `lib/demo/session-store.ts` re-exports them for older UI
 * modules that still import via the session-store path.
 */

import type { Camera } from "@/lib/supabase";

export type Severity = "Minor" | "Medium" | "High";

/** Notification channels an alert can be delivered through. */
export type AlertChannel = "dashboard" | "email" | "sms";

export interface DetectionRule {
  id: string;
  label: string;
  description?: string;
  severity: Severity;
}

export interface AlertPrefs {
  email?: string;
  phone?: string;
  /** Notification channels, e.g. ["email", "sms", "dashboard"]. */
  channels: AlertChannel[];
  /** Only alert at or above this severity. */
  severityThreshold: Severity;
}

export interface DemoSessionState {
  orgName: string | null;
  cameras: Camera[];
  detectionRules: DetectionRule[];
  alertPrefs: AlertPrefs;
  onboardingComplete: boolean;
}
