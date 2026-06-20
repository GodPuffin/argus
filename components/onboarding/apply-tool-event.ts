import type { OnboardingToolEvent } from "@/components/onboarding/onboarding-types";
import {
  addCamera,
  addDetectionRule,
  setAlerts,
  setOrgName,
} from "@/lib/demo/session-store";

/**
 * Apply a single onboarding tool event to the demo-session store.
 *
 * Pure with respect to UI: it performs the store mutations a tool call implies
 * and returns `true` when the event signals that onboarding is complete (so the
 * caller can advance to the confirm phase). It does not deduplicate — callers
 * are responsible for invoking each event at most once.
 */
export function applyToolEvent(event: OnboardingToolEvent): boolean {
  switch (event.type) {
    case "tool-setOrgName": {
      const out = event.output;
      if (out.name) setOrgName(out.name);
      return false;
    }
    case "tool-addCamera": {
      const out = event.output;
      if (out.name) addCamera({ name: out.name, location: out.location });
      return false;
    }
    case "tool-addDetectionRule": {
      const out = event.output;
      if (out.label) {
        addDetectionRule({
          label: out.label,
          description: out.description,
          severity: out.severity,
        });
      }
      return false;
    }
    case "tool-setAlerts": {
      const out = event.output;
      setAlerts({
        channels: out.channels,
        severityThreshold: out.severityThreshold,
        email: out.email,
        phone: out.phone,
      });
      return false;
    }
    case "tool-completeOnboarding":
      return true;
    default:
      return false;
  }
}
