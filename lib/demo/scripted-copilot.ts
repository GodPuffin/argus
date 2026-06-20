/**
 * Deterministic scripted copilot — the no-LLM fallback for the onboarding
 * wizard. When no provider key is configured (or the rate limiter trips), this
 * pattern-matches the visitor's setup description and emits the same tool calls
 * the real model would, so the wizard always works on stage.
 *
 * It is intentionally rule-based and dependency-free. The route turns the
 * returned plan into a UI message stream (text + tool parts).
 */

import type { Severity } from "@/lib/demo/types";

export type ScriptedToolName =
  | "setOrgName"
  | "addCamera"
  | "addDetectionRule"
  | "setAlerts"
  | "completeOnboarding";

export interface ScriptedCall {
  toolName: ScriptedToolName;
  input: Record<string, unknown>;
}

export interface ScriptedTurn {
  text: string;
  calls: ScriptedCall[];
}

interface LocationRule {
  re: RegExp;
  name: string;
}

const LOCATION_RULES: LocationRule[] = [
  { re: /\block(by|bies)\b|lobby/i, name: "Lobby" },
  { re: /parking|\bgarage\b|\blot\b/i, name: "Parking Lot" },
  { re: /reception|front desk/i, name: "Reception" },
  { re: /(loading )?dock/i, name: "Loading Dock" },
  {
    re: /front (door|entrance|entry)|main (entrance|entry)/i,
    name: "Front Entrance",
  },
  { re: /(rear|back) (door|entrance|entry)/i, name: "Rear Entrance" },
  { re: /warehouse/i, name: "Warehouse" },
  { re: /server room|data ?center|server/i, name: "Server Room" },
  { re: /roof(top)?/i, name: "Rooftop" },
  { re: /hall(way)?|corridor/i, name: "Hallway" },
  { re: /elevator|\blift\b/i, name: "Elevator" },
  { re: /stair(well|s|way)?/i, name: "Stairwell" },
  { re: /perimeter|fence|\byard\b/i, name: "Perimeter" },
  { re: /\bexit\b/i, name: "Exit" },
];

interface DetectionRuleMatch {
  re: RegExp;
  label: string;
  severity: Severity;
  description: string;
}

const DETECTION_RULES: DetectionRuleMatch[] = [
  {
    re: /weapon|\bgun\b|knife|firearm|pistol|rifle/i,
    label: "Weapons Detection",
    severity: "High",
    description: "Flag any visible weapon in frame.",
  },
  {
    re: /medical|health|\bfall(s|en|ing)?\b|collaps|injur|faint|seizure/i,
    label: "Medical Emergency",
    severity: "High",
    description: "Detect people who have fallen or appear in distress.",
  },
  {
    re: /\bfire\b|smoke|flame/i,
    label: "Fire & Smoke",
    severity: "High",
    description: "Detect fire or smoke and escalate immediately.",
  },
  {
    re: /theft|shoplift|steal|stolen|robbery|robber/i,
    label: "Theft",
    severity: "High",
    description: "Flag concealment of merchandise and suspected theft.",
  },
  {
    re: /intrud|trespass|unauthor|break-?in|breaking in|burglar/i,
    label: "Unauthorized Access",
    severity: "High",
    description: "Detect people entering restricted areas.",
  },
  {
    re: /loiter/i,
    label: "Loitering",
    severity: "Medium",
    description: "Flag individuals lingering for extended periods.",
  },
  {
    re: /crowd|gathering|congregat/i,
    label: "Crowding",
    severity: "Medium",
    description: "Detect unusual crowd density.",
  },
  {
    re: /vehicle|traffic|collision|crash|\bcar\b|speeding/i,
    label: "Traffic Incident",
    severity: "Medium",
    description: "Detect vehicle collisions and unsafe driving.",
  },
  {
    re: /\bppe\b|helmet|hard ?hat|safety vest|safety/i,
    label: "Safety Compliance",
    severity: "Medium",
    description: "Flag missing PPE in work zones.",
  },
  {
    re: /vandal|graffiti|damage/i,
    label: "Vandalism",
    severity: "Medium",
    description: "Detect property damage and vandalism.",
  },
  {
    re: /tailgat|piggyback/i,
    label: "Tailgating",
    severity: "Medium",
    description: "Detect unauthorized following through secure doors.",
  },
];

const BUILDING_RULES: Array<{ re: RegExp; org: string }> = [
  { re: /office|workplace|corporate/i, org: "Office HQ" },
  { re: /warehouse|distribution|fulfil/i, org: "Warehouse Facility" },
  { re: /retail|store|shop|boutique/i, org: "Retail Store" },
  { re: /school|campus|university|college/i, org: "Campus Security" },
  { re: /hospital|clinic|medical center/i, org: "Medical Center" },
  { re: /apartment|residential|condo|housing/i, org: "Residential Complex" },
  { re: /factory|plant|manufactur/i, org: "Manufacturing Plant" },
  { re: /hotel|hospitality|resort/i, org: "Hotel & Resort" },
  { re: /parking|garage/i, org: "Parking Operations" },
];

const CONFIRM_RE =
  /\b(confirm|finish|done|complete|looks good|that'?s all|all set|launch|go ahead|let'?s go|proceed|finalize|wrap up)\b/i;

function extractOrgName(text: string): string | null {
  // Explicit naming: "company X", "called X", "org is X", quoted names.
  const explicit = text.match(
    /(?:org(?:anization)?|company|business|site|building|facility|office|store|name(?:d)?)\s+(?:is\s+|called\s+|named\s+|=\s*)?["']([^"']{2,40})["']/i,
  );
  if (explicit) return explicit[1].trim();
  const called = text.match(
    /\b(?:called|named)\s+["']?([A-Z][\w&'.-]*(?:\s+[A-Z][\w&'.-]*){0,3})["']?/,
  );
  if (called) return called[1].trim();
  // Building-type fallback.
  for (const b of BUILDING_RULES) {
    if (b.re.test(text)) return b.org;
  }
  return null;
}

interface ScriptContext {
  hasOrgName: boolean;
  existingCameraNames: string[];
  existingRuleLabels: string[];
}

/**
 * Produce the scripted plan for a single user turn given the current overlay
 * context (so we don't re-emit duplicates the user already has).
 */
export function scriptedOnboardingTurn(
  userText: string,
  ctx: ScriptContext,
): ScriptedTurn {
  const text = userText ?? "";
  const calls: ScriptedCall[] = [];
  const summaryParts: string[] = [];

  // Organization name.
  if (!ctx.hasOrgName) {
    const org = extractOrgName(text);
    if (org) {
      calls.push({ toolName: "setOrgName", input: { name: org } });
      summaryParts.push(`set your organization to **${org}**`);
    }
  }

  // Cameras.
  const existing = new Set(ctx.existingCameraNames.map((n) => n.toLowerCase()));
  const addedCameras: string[] = [];
  for (const loc of LOCATION_RULES) {
    if (loc.re.test(text) && !existing.has(loc.name.toLowerCase())) {
      existing.add(loc.name.toLowerCase());
      addedCameras.push(loc.name);
      calls.push({ toolName: "addCamera", input: { name: loc.name } });
    }
  }
  if (addedCameras.length) {
    summaryParts.push(
      `added ${addedCameras.length} camera${addedCameras.length > 1 ? "s" : ""} (${addedCameras.join(", ")})`,
    );
  }

  // Detection rules.
  const existingRules = new Set(
    ctx.existingRuleLabels.map((n) => n.toLowerCase()),
  );
  const addedRules: string[] = [];
  for (const rule of DETECTION_RULES) {
    if (rule.re.test(text) && !existingRules.has(rule.label.toLowerCase())) {
      existingRules.add(rule.label.toLowerCase());
      addedRules.push(rule.label);
      calls.push({
        toolName: "addDetectionRule",
        input: {
          label: rule.label,
          description: rule.description,
          severity: rule.severity,
        },
      });
    }
  }
  if (addedRules.length) {
    summaryParts.push(`enabled detection for ${addedRules.join(", ")}`);
  }

  // Alerts.
  const wantsEmail = /email|e-mail/i.test(text);
  const wantsSms = /\bsms\b|text message|texts?\b|phone/i.test(text);
  const highOnly =
    /high(\s|-)?only|critical(\s|-)?only|only (high|critical)/i.test(text);
  if (wantsEmail || wantsSms || highOnly) {
    const channels = ["dashboard"];
    if (wantsEmail) channels.push("email");
    if (wantsSms) channels.push("sms");
    calls.push({
      toolName: "setAlerts",
      input: {
        channels,
        severityThreshold: highOnly ? "High" : "Medium",
      },
    });
    summaryParts.push(`configured alerts via ${channels.join(", ")}`);
  }

  // Completion.
  if (CONFIRM_RE.test(text)) {
    calls.push({ toolName: "completeOnboarding", input: { confirm: true } });
  }

  // Build a friendly, grounded reply.
  let reply: string;
  if (calls.some((c) => c.toolName === "completeOnboarding")) {
    reply =
      "All set — your workspace is ready. Taking you to the live dashboard now.";
  } else if (summaryParts.length) {
    const joined =
      summaryParts.length > 1
        ? `${summaryParts.slice(0, -1).join(", ")} and ${summaryParts.at(-1)}`
        : summaryParts[0];
    reply = `Done — I ${joined}. Tell me about anything else you'd like to watch or flag, or say "finish" when you're ready.`;
  } else {
    reply =
      "Tell me about your space — what kind of site it is, which areas you want cameras on (e.g. lobby, parking, loading dock), and what you'd like flagged (e.g. weapons, medical emergencies, theft). I'll set it all up.";
  }

  return { text: reply, calls };
}

/** Generic non-onboarding fallback text for the main AI chat with no key. */
export function scriptedAssistantText(): string {
  return (
    "I'm running in offline demo mode right now, so live AI responses are " +
    "paused. You can still explore the dashboard, watch cameras, browse " +
    "events and reports, and try the onboarding copilot. Add an " +
    "`ANTHROPIC_API_KEY` to enable full conversational AI."
  );
}
