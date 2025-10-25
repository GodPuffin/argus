/**
 * Google Gemini API Client
 * Multimodal video analysis using Gemini with structured output
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { GoogleGenAI } from "@google/genai";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { GeminiAnalysisResponse } from "./types.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

// Initialize Gemini client for file operations
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Initialize Google provider for AI SDK with API key
const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });

// Define structured output schema
const analysisSchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence summary of what is happening in the video"),
  tags: z.array(z.string()).max(10).describe("Relevant tags and keywords"),
  entities: z.array(
    z.object({
      type: z.string().describe("Entity type: person, object, location, activity, etc."),
      name: z.string().describe("Name or description of the entity"),
      confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
    }),
  ).describe("Detected entities in the video"),
  events: z.array(
    z.object({
      name: z.string().describe("Event name or title"),
      description: z.string().describe("Detailed description of what happened"),
      severity: z.enum(["Minor", "Medium", "High"]).describe("Severity level of the event"),
      type: z.enum([
        "Crime",
        "Medical Emergency",
        "Traffic Incident",
        "Property Damage",
        "Safety Hazard",
        "Suspicious Activity",
        "Normal Activity",
        "Camera Interference",
      ]).describe("Type/category of the event"),
      timestamp_seconds: z.number().min(0).max(60).describe("When the event occurred in seconds from the start of this clip (0-60)"),
      affected_entity_ids: z.array(z.number()).optional().describe("Optional array of entity indices (0-based) from the entities array that are involved in this event"),
    }),
  ).describe("Notable events or actions that occurred in the video"),
});

/**
 * Upload video buffer to Gemini Files API
 * Uses @google/genai SDK and waits for processing
 */
async function uploadVideoToGemini(
  videoBuffer: Buffer,
): Promise<{ name: string; uri: string; mimeType: string }> {
  // Write buffer to temp file (SDK requires file path)
  const tempPath = join(
    tmpdir(),
    `gemini-${randomBytes(8).toString("hex")}.mp4`,
  );

  try {
    await writeFile(tempPath, videoBuffer);
    console.log(`Uploading video to Gemini (${videoBuffer.length} bytes)...`);

    const uploadResult = await genai.files.upload({
      file: tempPath,
      config: {
        mimeType: "video/mp4",
        displayName: "segment.mp4",
      },
    });

    console.log(`Video uploaded: ${uploadResult.displayName} as ${uploadResult.uri}`);

    // Wait for file to be processed
    let file = await genai.files.get({ name: uploadResult.name! });
    while (file.state === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await genai.files.get({ name: uploadResult.name! });
      console.log(`File processing... (${file.state})`);
    }

    if (file.state === "FAILED") {
      throw new Error("Video processing failed");
    }

    console.log("Video processing complete");

    return {
      name: file.name!,
      uri: file.uri!,
      mimeType: file.mimeType!,
    };
  } finally {
    // Clean up temp file
    await unlink(tempPath).catch(() => {
      /* ignore cleanup errors */
    });
  }
}

/**
 * Analyze video with Gemini using structured output
 * Returns type-safe analysis results
 */
export async function analyzeVideoWithGemini(
  videoBuffer: Buffer,
): Promise<GeminiAnalysisResponse> {
  // Upload video and wait for processing
  const { uri, mimeType } = await uploadVideoToGemini(videoBuffer);

  console.log("Analyzing video with Gemini using structured output...");

  // Use AI SDK's generateObject for structured, validated output
  const { object } = await generateObject({
    model: google(GEMINI_MODEL),
    schema: analysisSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this video segment and provide:
1. A concise summary (2-3 sentences) of what is happening.
2. Relevant tags or keywords (up to 10).
3. Detected people, objects, locations, and activities with confidence scores.
4. Notable events with detailed information:

IMPORTANT: Only describe events that are genuinely noteworthy and would matter to a human reviewer. If nothing significant happens, simply return no events. Avoid flagging trivial or routine actions.

For each notable event, provide:
   - Name: A clear, descriptive title for what occurred.
   - Description: A detailed, natural-language explanation of the event, written as a human would describe it.
   - Severity: Assess the urgency or importance:
     * High: Critical incidents requiring immediate attention (e.g., active theft, assault, medical emergency, fire, weapon detected, etc.)
     * Medium: Incidents that are unusual or suspicious and worth review (e.g., suspicious behavior, trespassing, safety violation, property damage, etc.)
     * Minor: Routine or expected events that may be worth noting (e.g., delivery, maintenance, normal activity in new area, etc.)
   - Type: Categorize the event as one of: Crime, Medical Emergency, Traffic Incident, Property Damage, Safety Hazard, Suspicious Activity, Normal Activity, or Camera Interference.
   - Timestamp: When the event occurred in seconds from the start of the clip (0-60 seconds).
   - Involvement: Briefly mention which people, objects, or situations were involved in the incident, using natural language and not dataset or index references.

Be natural and specific in your analysis, as if you are describing the video to another person. Express who was involved based on their appearance or action (e.g., "a woman places an item in her bag", "a man assists another person"), not by ID numbers or system references. For events, prioritize accuracy in timing and severity. Focus on quality over quantity; only highlight what truly matters.`,
          },
          {
            type: "file",
            data: uri,
            mediaType: mimeType,
          },
        ],
      },
    ],
  });

  console.log("Analysis complete:", {
    summary: object.summary.substring(0, 100) + "...",
    tagCount: object.tags.length,
    entityCount: object.entities.length,
    eventCount: object.events.length,
  });

  // Clean up uploaded file (optional - files auto-expire after 48h)
  try {
    const fileName = uri.split("/").pop()!;
    await genai.files.delete({ name: fileName });
    console.log("Cleaned up uploaded file");
  } catch (error) {
    console.warn("Could not delete uploaded file:", error);
  }

  return {
    summary: object.summary,
    tags: object.tags,
    entities: object.entities,
    events: object.events,
    raw: object,
  };
}

