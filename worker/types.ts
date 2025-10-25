/**
 * Type definitions for AI Analysis Worker
 */

export interface AnalysisJob {
  id: number;
  source_type: "vod" | "live";
  source_id: string;
  playback_id: string;
  start_epoch: number;
  end_epoch: number;
  asset_start_seconds: number | null;
  asset_end_seconds: number | null;
  status: "queued" | "processing" | "succeeded" | "failed" | "dead";
  attempts: number;
  error: string | null;
  result_ref: number | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisResult {
  job_id: number;
  summary: string;
  tags: string[];
  entities: any[];
  transcript_ref: string | null;
  embeddings_ref: string | null;
  raw: any;
  created_at: string;
}

export interface Event {
  name: string;
  description: string;
  severity: "Minor" | "Medium" | "High";
  type: "Crime" | "Medical Emergency" | "Traffic Incident" | "Property Damage" | "Safety Hazard" | "Suspicious Activity" | "Normal Activity" | "Camera Interference";
  timestamp_seconds: number;
  affected_entity_ids?: number[];
}

export interface GeminiAnalysisResponse {
  summary: string;
  tags: string[];
  entities: any[];
  events: Event[];
  raw: any;
}

