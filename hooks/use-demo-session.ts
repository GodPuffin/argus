"use client";

import { useSyncExternalStore } from "react";
import {
  type DemoSessionState,
  getServerSnapshot,
  getSnapshot,
  subscribe,
} from "@/lib/demo/session-store";

/**
 * Subscribe to the demo-session overlay store. SSR-safe: returns the empty
 * snapshot on the server / during hydration, then the hydrated localStorage
 * snapshot on the client.
 */
export function useDemoSession(): DemoSessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Re-export mutators for convenience so callers can do a single import.
export {
  addCamera,
  addDetectionRule,
  completeOnboarding,
  removeCamera,
  removeDetectionRule,
  reset,
  setAlerts,
  setOrgName,
} from "@/lib/demo/session-store";
