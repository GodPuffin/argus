/**
 * Type definitions for AI Analysis Worker
 */

/**
 * Entity types detected in video analysis
 * Matches the public.entity_type enum in the database
 */
export type EntityType = 
  | 'person'
  | 'vehicle'
  | 'car'
  | 'truck'
  | 'bus'
  | 'motorcycle'
  | 'bicycle'
  | 'animal'
  | 'pet'
  | 'dog'
  | 'cat'
  | 'package'
  | 'bag'
  | 'backpack'
  | 'weapon'
  | 'phone'
  | 'laptop'
  | 'object'
  | 'location'
  | 'activity'
  | 'other';

/**
 * Entity detected in video analysis
 */
export interface Entity {
  type: EntityType;
  name: string;
  confidence: number;
}

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
  entities: Entity[];
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
  entities: Entity[];
  events: Event[];
  raw: any;
}

export interface BoundingBox {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  width: number; // Normalized 0-1
  height: number; // Normalized 0-1
}

export interface Detection {
  class: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface ObjectDetection {
  frame_timestamp: number; // Relative seconds within segment
  frame_index: number;
  detections: Detection[];
}

export interface RoboflowAnalysisResponse {
  detections: ObjectDetection[];
  totalFrames: number;
  totalDetections: number;
}

