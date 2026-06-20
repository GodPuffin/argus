import { generateId, tool } from "ai";
import { z } from "zod";
import { isDemoMode } from "./demo/flag";
import { demoReportStore, mockEvents } from "./demo/mock-data";
import { type AIAnalysisEvent, supabase } from "./supabase";

/** Resolve an event by id from the in-memory demo fixtures. */
function getDemoEventById(eventId: number): AIAnalysisEvent {
  const event = mockEvents.find((e) => e.id === eventId);
  if (!event) {
    throw new Error(`Event ${eventId} not found in demo data`);
  }
  return event;
}

// Event severity and type enums matching database schema
const eventSeverityEnum = z.enum(["Minor", "Medium", "High"]);
const eventTypeEnum = z.enum([
  "Crime",
  "Medical Emergency",
  "Traffic Incident",
  "Property Damage",
  "Safety Hazard",
  "Suspicious Activity",
  "Normal Activity",
  "Camera Interference",
]);

/**
 * Tool 1: Display an event with all details provided
 * Use this when you already have event data from search results
 */
export const displayEvent = tool({
  description:
    "Display a video event with its details as an interactive card that users can click to watch the video at that moment",
  inputSchema: z.object({
    asset_id: z.string().describe("The video asset ID"),
    event_id: z.number().describe("The event ID"),
    name: z.string().describe("Event name or title"),
    description: z.string().describe("Event description"),
    severity: eventSeverityEnum.describe("Event severity level"),
    type: eventTypeEnum.describe("Event type category"),
    timestamp_seconds: z
      .number()
      .describe("When the event occurred in seconds from video start"),
    affected_entities: z
      .array(z.any())
      .optional()
      .describe("Optional array of entities involved in the event"),
  }),
  execute: async ({
    asset_id,
    event_id,
    name,
    description,
    severity,
    type,
    timestamp_seconds,
    affected_entities,
  }) => {
    return {
      asset_id,
      event_id,
      name,
      description,
      severity,
      type,
      timestamp_seconds,
      affected_entities: affected_entities || [],
    };
  },
});

/**
 * Tool 2: Display an event by fetching it from the database
 * Use this when you only have an event ID
 */
export const displayEventById = tool({
  description:
    "Display a video event by fetching it from the database using its ID. Returns an interactive card that users can click to watch the video at that moment.",
  inputSchema: z.object({
    event_id: z.number().describe("The event ID to fetch and display"),
  }),
  execute: async ({ event_id }) => {
    let event: AIAnalysisEvent;
    if (isDemoMode) {
      event = getDemoEventById(event_id);
    } else {
      const { data, error } = await supabase
        .from("ai_analysis_events")
        .select("*")
        .eq("id", event_id)
        .single();
      if (error) {
        throw new Error(`Failed to fetch event ${event_id}: ${error.message}`);
      }
      if (!data) {
        throw new Error(`Event ${event_id} not found`);
      }
      event = data as AIAnalysisEvent;
    }

    return {
      asset_id: event.asset_id,
      event_id: event.id,
      name: event.name,
      description: event.description,
      severity: event.severity,
      type: event.type,
      timestamp_seconds: event.timestamp_seconds,
      affected_entities: event.affected_entities || [],
    };
  },
});

/**
 * Tool 3: Display a video asset inline
 * Use this when you want to show a video player for an asset
 */
export const displayAsset = tool({
  description:
    "Display a video asset inline with a player and controls. Shows the video in the chat with an option to open the full viewer. Use this when you want to show a user a specific video recording.",
  inputSchema: z.object({
    asset_id: z.string().describe("The video asset ID to display"),
  }),
  execute: async ({ asset_id }) => {
    return {
      asset_id,
    };
  },
});

/**
 * Tool 4: Create a report
 * Use this to create documentation or analysis reports with markdown content
 */
export const createReport = tool({
  description:
    "Create a new report with the given title and markdown content. Use this to generate documentation, analysis summaries, or investigation reports. The report will be saved and a preview link will be shown to the user.",
  inputSchema: z.object({
    title: z.string().describe("The title of the report"),
    markdown: z
      .string()
      .describe(
        "The markdown content for the report. Use proper markdown formatting with headings, lists, bold/italic text, etc.",
      ),
  }),
  execute: async ({ title, markdown }) => {
    const { marked } = await import("marked");
    const { generateJSON } = await import("@tiptap/html");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Underline = (await import("@tiptap/extension-underline")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const TaskList = (await import("@tiptap/extension-task-list")).default;
    const TaskItem = (await import("@tiptap/extension-task-item")).default;
    const ListItem = (await import("@tiptap/extension-list-item")).default;

    // Default to an empty doc; replaced below once markdown is converted.
    let content: Record<string, unknown> = {
      type: "doc",
      content: [{ type: "paragraph" }],
    };
    try {
      // GFM + breaks so report markdown renders the way users expect.
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const html = await marked(markdown);

      content = generateJSON(html, [
        StarterKit.configure({
          listItem: false, // We use custom ListItem
        }),
        ListItem,
        Underline,
        Link,
        TaskList,
        TaskItem,
      ]);
    } catch (err) {
      console.error("Error converting markdown:", err);
      // Fall back to the raw markdown as plain text so the report still saves.
      content = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: markdown,
              },
            ],
          },
        ],
      };
    }

    if (isDemoMode) {
      const store = demoReportStore();
      const now = new Date().toISOString();
      const report = {
        id: `demo-report-${generateId()}`,
        title,
        content,
        created_at: now,
        updated_at: now,
      };
      store.unshift(report);
      return {
        id: report.id,
        title: report.title,
        created_at: report.created_at,
      };
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        title,
        content,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    return {
      id: report.id,
      title: report.title,
      created_at: report.created_at,
    };
  },
});

// ────────────────────────────────────────────────────────────────────────
// Onboarding copilot tools
//
// Pass-through tools (mirrors the displayEvent pattern): `execute` simply
// returns the validated args. The onboarding client reads these outputs from
// the streamed message parts and applies them to the demo-session store.
// ────────────────────────────────────────────────────────────────────────

export const setOrgName = tool({
  description:
    "Set the organization / site name for the workspace being configured. Call this once you know what to call the deployment.",
  inputSchema: z.object({
    name: z
      .string()
      .describe("The organization or site name, e.g. 'Office HQ'"),
  }),
  execute: async ({ name }) => ({ name }),
});

export const addCamera = tool({
  description:
    "Add a camera to the workspace for a specific area the user wants to monitor. Call once per camera. Prefer short, location-based names.",
  inputSchema: z.object({
    name: z
      .string()
      .describe("Camera name, usually the area it watches, e.g. 'Lobby'"),
    location: z
      .string()
      .optional()
      .describe("Optional finer location detail, e.g. 'North entrance'"),
  }),
  execute: async ({ name, location }) => ({ name, location }),
});

export const addDetectionRule = tool({
  description:
    "Add an AI detection rule describing something the user wants flagged (e.g. weapons, medical emergencies, theft). Call once per rule.",
  inputSchema: z.object({
    label: z.string().describe("Short rule name, e.g. 'Weapons Detection'"),
    description: z
      .string()
      .optional()
      .describe("What the rule should detect, in one sentence."),
    severity: eventSeverityEnum
      .optional()
      .describe("How serious a match is. Defaults to Medium."),
  }),
  execute: async ({ label, description, severity }) => ({
    label,
    description,
    severity: severity ?? "Medium",
  }),
});

export const setAlerts = tool({
  description:
    "Configure how the user is notified about detections: which channels (dashboard, email, sms) and the minimum severity that triggers an alert.",
  inputSchema: z.object({
    channels: z
      .array(z.enum(["dashboard", "email", "sms"]))
      .optional()
      .describe("Notification channels to enable."),
    severityThreshold: eventSeverityEnum
      .optional()
      .describe("Only alert at or above this severity."),
    email: z.string().optional().describe("Email address for alerts."),
    phone: z.string().optional().describe("Phone number for SMS alerts."),
  }),
  execute: async ({ channels, severityThreshold, email, phone }) => ({
    channels: channels ?? ["dashboard"],
    severityThreshold: severityThreshold ?? "Medium",
    email,
    phone,
  }),
});

export const completeOnboarding = tool({
  description:
    "Finish onboarding once the user confirms their setup looks good. Only call after summarizing what was configured and getting confirmation.",
  inputSchema: z.object({
    confirm: z
      .boolean()
      .optional()
      .describe("Whether the user confirmed completion."),
  }),
  execute: async ({ confirm }) => ({ confirm: confirm ?? true }),
});

export const aiTools = {
  displayEvent,
  displayEventById,
  displayAsset,
  createReport,
};

export const onboardingTools = {
  setOrgName,
  addCamera,
  addDetectionRule,
  setAlerts,
  completeOnboarding,
};
