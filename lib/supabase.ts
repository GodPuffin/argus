import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// Client for both frontend and backend (no RLS in demo project)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Entity types detected in video analysis
// Matches the public.entity_type enum in the database
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

// Entity detected in video analysis
export interface Entity {
  type: EntityType;
  name: string;
  confidence: number;
}

// Database types
// Camera is now based on mux.live_streams table with camera-specific fields
export interface Camera {
  id: string;
  browser_id: string | null;
  camera_name: string;
  stream_key: string;
  playback_ids: Array<{ id: string; policy: string }> | any; // JSONB field from Mux
  status: "idle" | "active" | "disabled";
  created_at: string;
  last_connected_at: string | null;
  // Additional Mux fields available:
  active_asset_id?: string | null;
  recent_asset_ids?: any; // JSONB
  latency_mode?: string;
  reconnect_window_seconds?: number;
}

// Asset is based on mux.assets table
export interface Asset {
  id: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
  max_stored_frame_rate: number | null;
  aspect_ratio: string | null;
  playback_ids: Array<{ id: string; policy: string }> | any; // JSONB field from Mux
  tracks: any; // JSONB
  errors: any; // JSONB
  master_access: string | null;
  master: any; // JSONB
  normalize_audio: boolean;
  is_live: boolean;
  static_renditions: any; // JSONB
  test: boolean;
  passthrough: string | null;
  live_stream_id: string | null;
  ingest_type: string | null;
  source_asset_id: string | null;
  upload_id: string | null;
  input_info: any; // JSONB
  video_quality: string | null;
  resolution_tier: string | null;
  non_standard_input_reasons: any; // JSONB
  progress: any; // JSONB
  meta: any; // JSONB
  max_resolution_tier: string | null;
  recording_times: any; // JSONB
  // Convenience aliases
  playbackId?: string;
  createdAt?: string;
  maxStoredResolution?: string;
  duration?: number;
}

// Helper to get the first playback ID from the JSONB array
export function getPlaybackId(camera: Camera): string | null {
  if (Array.isArray(camera.playback_ids) && camera.playback_ids.length > 0) {
    return camera.playback_ids[0]?.id || null;
  }
  return null;
}

// Helper to get the first playback ID from an asset's JSONB array
export function getAssetPlaybackId(asset: Asset): string | null {
  if (Array.isArray(asset.playback_ids) && asset.playback_ids.length > 0) {
    return asset.playback_ids[0]?.id || null;
  }
  return null;
}

// AI Analysis Job types
export interface AIAnalysisJob {
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

export interface AIAnalysisResult {
  job_id: number;
  summary: string | null;
  tags: string[] | any;
  entities: Entity[] | any;
  transcript_ref: string | null;
  embeddings_ref: string | null;
  raw: any;
  created_at: string;
}

export interface AIAnalysisEvent {
  id: number;
  job_id: number;
  asset_id: string;
  name: string;
  description: string;
  severity: "Minor" | "Medium" | "High";
  type: "Crime" | "Medical Emergency" | "Traffic Incident" | "Property Damage" | "Safety Hazard" | "Suspicious Activity" | "Normal Activity" | "Camera Interference";
  timestamp_seconds: number;
  affected_entities: Entity[] | any;
  created_at: string;
}

