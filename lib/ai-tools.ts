import { tool } from "ai";
import { z } from "zod";
import { supabase } from "./supabase";

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
    // Passthrough - return data as-is for UI rendering
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
    // Fetch event from database
    const { data: event, error } = await supabase
      .from("ai_analysis_events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch event ${event_id}: ${error.message}`);
    }

    if (!event) {
      throw new Error(`Event ${event_id} not found`);
    }

    // Return formatted event data
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
    // Passthrough - return data as-is for UI rendering
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
    // Import required modules
    const { marked } = await import("marked");
    const { generateJSON } = await import("@tiptap/html");
    const StarterKit = (await import("@tiptap/starter-kit")).default;
    const Underline = (await import("@tiptap/extension-underline")).default;
    const Link = (await import("@tiptap/extension-link")).default;
    const TaskList = (await import("@tiptap/extension-task-list")).default;
    const TaskItem = (await import("@tiptap/extension-task-item")).default;
    const ListItem = (await import("@tiptap/extension-list-item")).default;

    // Convert markdown to HTML first
    let content = { type: "doc", content: [{ type: "paragraph" }] };
    try {
      // Configure marked to preserve line breaks and use GFM (GitHub Flavored Markdown)
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const html = await marked(markdown);

      // Convert HTML to Tiptap JSON with all extensions
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
      // If conversion fails, create a simple paragraph with the markdown text
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

    // Return report data for UI rendering
    return {
      id: report.id,
      title: report.title,
      created_at: report.created_at,
    };
  },
});

// Export tools object
export const aiTools = {
  displayEvent,
  displayEventById,
  displayAsset,
  createReport,
};
