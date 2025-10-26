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
  description: "Display a video event with its details as an interactive card that users can click to watch the video at that moment",
  inputSchema: z.object({
    asset_id: z.string().describe("The video asset ID"),
    event_id: z.number().describe("The event ID"),
    name: z.string().describe("Event name or title"),
    description: z.string().describe("Event description"),
    severity: eventSeverityEnum.describe("Event severity level"),
    type: eventTypeEnum.describe("Event type category"),
    timestamp_seconds: z.number().describe("When the event occurred in seconds from video start"),
    affected_entities: z.array(z.any()).optional().describe("Optional array of entities involved in the event"),
  }),
  execute: async function ({
    asset_id,
    event_id,
    name,
    description,
    severity,
    type,
    timestamp_seconds,
    affected_entities,
  }) {
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
  description: "Display a video event by fetching it from the database using its ID. Returns an interactive card that users can click to watch the video at that moment.",
  inputSchema: z.object({
    event_id: z.number().describe("The event ID to fetch and display"),
  }),
  execute: async function ({ event_id }) {
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

// Export tools object
export const aiTools = {
  displayEvent,
  displayEventById,
};

