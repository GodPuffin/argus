import type { DemoSessionState } from "@/lib/demo/session-store";

/**
 * Whether each onboarding section is "complete", in marker order:
 * [organization, cameras, detection rules, alerts]. Shared by the review
 * canvas progress markers and the per-section "done" indicators.
 */
export function sectionCompletion(
  session: DemoSessionState,
): [boolean, boolean, boolean, boolean] {
  return [
    !!session.orgName,
    session.cameras.length > 0,
    session.detectionRules.length > 0,
    session.alertPrefs.channels.length > 1 ||
      !!session.alertPrefs.email ||
      !!session.alertPrefs.phone,
  ];
}
