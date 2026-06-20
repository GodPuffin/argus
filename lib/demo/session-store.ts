/**
 * Demo-session overlay store
 *
 * A tiny `localStorage`-backed module store that holds the visitor's onboarding
 * choices (org name, session-added cameras, detection rules, alert prefs) and an
 * `onboardingComplete` flag. Dashboard hooks merge this overlay on top of the
 * base mock fixtures so a visitor's "added" cameras show up alongside the seed
 * data for the rest of their session.
 *
 * Designed for `useSyncExternalStore`:
 *   - `subscribe(cb)` registers a listener, returns an unsubscribe fn.
 *   - `getSnapshot()` returns a referentially-stable snapshot (new object only
 *     when state actually changes), hydrated lazily from `localStorage`.
 *   - `getServerSnapshot()` returns a constant empty snapshot so SSR + hydration
 *     stay stable (React de-opts the subscribed value to a client re-render).
 *
 * The store is client-only. Server routes can't read `localStorage`, so the
 * overlay is intentionally never sent to the server — camera/stat merges happen
 * in client hooks (see `hooks/use-cameras-realtime.ts`).
 */

import { PUBLIC_PLAYBACKS } from "@/lib/demo/mock-data";
import type {
  AlertPrefs,
  DemoSessionState,
  DetectionRule,
  Severity,
} from "@/lib/demo/types";
import type { Camera } from "@/lib/supabase";

// `@/lib/demo/types` is the canonical home for these domain types; new code
// should import them from there. This re-export is kept only because several
// existing UI modules still import them via the session-store path.
export type {
  AlertChannel,
  AlertPrefs,
  DemoSessionState,
  DetectionRule,
  Severity,
} from "@/lib/demo/types";

const STORAGE_KEY = "argus.demo.session.v1";

export const EMPTY_SESSION: DemoSessionState = {
  orgName: null,
  cameras: [],
  detectionRules: [],
  alertPrefs: { channels: ["dashboard"], severityThreshold: "Medium" },
  onboardingComplete: false,
};

// ────────────────────────────────────────────────────────────────────────
// Internal state + subscription plumbing
// ────────────────────────────────────────────────────────────────────────

let state: DemoSessionState = EMPTY_SESSION;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DemoSessionState>;
      state = {
        ...EMPTY_SESSION,
        ...parsed,
        cameras: parsed.cameras ?? [],
        detectionRules: parsed.detectionRules ?? [],
        alertPrefs: { ...EMPTY_SESSION.alertPrefs, ...parsed.alertPrefs },
      };
    }
  } catch {
    // Corrupt payload — fall back to empty and overwrite on next persist.
    state = EMPTY_SESSION;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota / private-mode errors are non-fatal for a demo overlay.
  }
}

function setState(next: DemoSessionState) {
  state = next;
  persist();
  for (const l of listeners) l();
}

// Cross-tab + reset propagation.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    hydrated = false;
    hydrateOnce();
    for (const l of listeners) l();
  });
}

// ────────────────────────────────────────────────────────────────────────
// useSyncExternalStore contract
// ────────────────────────────────────────────────────────────────────────

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): DemoSessionState {
  hydrateOnce();
  return state;
}

export function getServerSnapshot(): DemoSessionState {
  return EMPTY_SESSION;
}

// ────────────────────────────────────────────────────────────────────────
// Mutators
// ────────────────────────────────────────────────────────────────────────

function slug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export function setOrgName(orgName: string) {
  hydrateOnce();
  setState({ ...state, orgName: orgName.trim() || null });
}

export interface AddCameraInput {
  name: string;
  location?: string;
  status?: Camera["status"];
}

/**
 * Build a fully-formed `Camera` for a session-added entry. Active cameras get a
 * public playback ID so the watch tile renders live video, matching the base
 * mock cameras.
 */
export function addCamera(input: AddCameraInput): Camera {
  hydrateOnce();
  const index = state.cameras.length;
  const status: Camera["status"] = input.status ?? "active";
  const playback = PUBLIC_PLAYBACKS[index % PUBLIC_PLAYBACKS.length];
  const id = `session-cam-${slug(input.name) || "camera"}-${index + 1}`;
  const camera: Camera = {
    id,
    browser_id: `session-browser-${index + 1}`,
    camera_name: input.location
      ? `${input.name} — ${input.location}`
      : input.name,
    stream_key: `session-key-${index + 1}`,
    playback_ids: [{ id: playback, policy: "public" }],
    status,
    created_at: new Date().toISOString(),
    last_connected_at: status === "active" ? new Date().toISOString() : null,
    active_asset_id: null,
    recent_asset_ids: [],
    latency_mode: "low",
    reconnect_window_seconds: 60,
  };
  setState({ ...state, cameras: [...state.cameras, camera] });
  return camera;
}

export function removeCamera(id: string) {
  hydrateOnce();
  setState({ ...state, cameras: state.cameras.filter((c) => c.id !== id) });
}

export function renameCamera(id: string, camera_name: string) {
  hydrateOnce();
  setState({
    ...state,
    cameras: state.cameras.map((c) =>
      c.id === id ? { ...c, camera_name } : c,
    ),
  });
}

export interface AddDetectionRuleInput {
  label: string;
  description?: string;
  severity?: Severity;
}

export function addDetectionRule(input: AddDetectionRuleInput): DetectionRule {
  hydrateOnce();
  const rule: DetectionRule = {
    id: `rule-${slug(input.label) || "rule"}-${state.detectionRules.length + 1}`,
    label: input.label,
    description: input.description,
    severity: input.severity ?? "Medium",
  };
  setState({ ...state, detectionRules: [...state.detectionRules, rule] });
  return rule;
}

export function removeDetectionRule(id: string) {
  hydrateOnce();
  setState({
    ...state,
    detectionRules: state.detectionRules.filter((r) => r.id !== id),
  });
}

export function setAlerts(prefs: Partial<AlertPrefs>) {
  hydrateOnce();
  setState({ ...state, alertPrefs: { ...state.alertPrefs, ...prefs } });
}

export function completeOnboarding(complete = true) {
  hydrateOnce();
  setState({ ...state, onboardingComplete: complete });
}

export function reset() {
  setState({ ...EMPTY_SESSION, alertPrefs: { ...EMPTY_SESSION.alertPrefs } });
}
