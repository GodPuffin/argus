/**
 * Helper functions for querying AI analysis data
 * Use these in your Next.js API routes or components
 */

import { supabase } from "./supabase";

export interface AnalysisJobSummary {
  total: number;
  queued: number;
  processing: number;
  succeeded: number;
  failed: number;
  dead: number;
}

export interface AnalysisResult {
  job_id: number;
  summary: string;
  tags: string[];
  entities: any[];
  raw: any;
  created_at: string;
  // Joined from job
  source_type: "vod" | "live";
  source_id: string;
  start_epoch: number;
  end_epoch: number;
}

export interface AnalysisEvent {
  id: number;
  job_id: number;
  asset_id: string;
  name: string;
  description: string;
  severity: "Minor" | "Medium" | "High";
  type: "Crime" | "Medical Emergency" | "Traffic Incident" | "Property Damage" | "Safety Hazard" | "Suspicious Activity" | "Normal Activity" | "Camera Interference";
  timestamp_seconds: number;
  affected_entities: any[];
  created_at: string;
}

/**
 * Get job queue statistics
 */
export async function getJobStats(): Promise<AnalysisJobSummary> {
  const { data, error } = await supabase
    .from("ai_analysis_jobs")
    .select("status");

  if (error) {
    throw error;
  }

  const stats: AnalysisJobSummary = {
    total: data.length,
    queued: 0,
    processing: 0,
    succeeded: 0,
    failed: 0,
    dead: 0,
  };

  for (const job of data) {
    stats[job.status as keyof AnalysisJobSummary]++;
  }

  return stats;
}

/**
 * Get analysis results for a specific source (asset or live stream)
 */
export async function getResultsForSource(
  sourceId: string,
  limit = 100,
): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from("ai_analysis_results")
    .select(
      `
      *,
      ai_analysis_jobs!inner (
        source_type,
        source_id,
        start_epoch,
        end_epoch
      )
    `,
    )
    .eq("ai_analysis_jobs.source_id", sourceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  // Flatten joined data
  return (data || []).map((row: any) => ({
    job_id: row.job_id,
    summary: row.summary,
    tags: row.tags || [],
    entities: row.entities || [],
    raw: row.raw || {},
    created_at: row.created_at,
    source_type: row.ai_analysis_jobs.source_type,
    source_id: row.ai_analysis_jobs.source_id,
    start_epoch: row.ai_analysis_jobs.start_epoch,
    end_epoch: row.ai_analysis_jobs.end_epoch,
  }));
}

/**
 * Search analysis results by tag
 */
export async function searchByTag(
  tag: string,
  limit = 50,
): Promise<AnalysisResult[]> {
  const { data, error } = await supabase
    .from("ai_analysis_results")
    .select(
      `
      *,
      ai_analysis_jobs!inner (
        source_type,
        source_id,
        start_epoch,
        end_epoch
      )
    `,
    )
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map((row: any) => ({
    job_id: row.job_id,
    summary: row.summary,
    tags: row.tags || [],
    entities: row.entities || [],
    raw: row.raw || {},
    created_at: row.created_at,
    source_type: row.ai_analysis_jobs.source_type,
    source_id: row.ai_analysis_jobs.source_id,
    start_epoch: row.ai_analysis_jobs.start_epoch,
    end_epoch: row.ai_analysis_jobs.end_epoch,
  }));
}

/**
 * Get recent analysis results with pagination
 */
export async function getRecentResults(
  page = 0,
  pageSize = 20,
): Promise<{ results: AnalysisResult[]; total: number }> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("ai_analysis_results")
    .select(
      `
      *,
      ai_analysis_jobs!inner (
        source_type,
        source_id,
        start_epoch,
        end_epoch
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const results = (data || []).map((row: any) => ({
    job_id: row.job_id,
    summary: row.summary,
    tags: row.tags || [],
    entities: row.entities || [],
    raw: row.raw || {},
    created_at: row.created_at,
    source_type: row.ai_analysis_jobs.source_type,
    source_id: row.ai_analysis_jobs.source_id,
    start_epoch: row.ai_analysis_jobs.start_epoch,
    end_epoch: row.ai_analysis_jobs.end_epoch,
  }));

  return {
    results,
    total: count || 0,
  };
}

/**
 * Get failed jobs for debugging
 */
export async function getFailedJobs(limit = 50) {
  const { data, error } = await supabase
    .from("ai_analysis_jobs")
    .select("*")
    .in("status", ["failed", "dead"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Retry a failed job by resetting it to queued
 */
export async function retryJob(jobId: number) {
  const { error } = await supabase
    .from("ai_analysis_jobs")
    .update({ status: "queued", error: null })
    .eq("id", jobId)
    .in("status", ["failed", "dead"]);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Get aggregate tags across all results
 */
export async function getPopularTags(limit = 20): Promise<
  Array<{ tag: string; count: number }>
> {
  // Note: This requires a custom SQL query for efficiency
  // Using RPC or a view would be more performant
  const { data, error } = await supabase
    .from("ai_analysis_results")
    .select("tags");

  if (error) {
    throw error;
  }

  const tagCounts = new Map<string, number>();

  for (const row of data || []) {
    for (const tag of row.tags || []) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get events for a specific asset
 */
export async function getEventsForAsset(
  assetId: string,
  options?: {
    severity?: "Minor" | "Medium" | "High";
    type?: string;
    limit?: number;
  },
): Promise<AnalysisEvent[]> {
  let query = supabase
    .from("ai_analysis_events")
    .select("*")
    .eq("asset_id", assetId);

  if (options?.severity) {
    query = query.eq("severity", options.severity);
  }

  if (options?.type) {
    query = query.eq("type", options.type);
  }

  query = query
    .order("timestamp_seconds", { ascending: true })
    .limit(options?.limit || 100);

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get events filtered by severity
 */
export async function getEventsBySeverity(
  severity: "Minor" | "Medium" | "High",
  limit = 50,
): Promise<AnalysisEvent[]> {
  const { data, error } = await supabase
    .from("ai_analysis_events")
    .select("*")
    .eq("severity", severity)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get events filtered by type
 */
export async function getEventsByType(
  type: string,
  limit = 50,
): Promise<AnalysisEvent[]> {
  const { data, error } = await supabase
    .from("ai_analysis_events")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get events in a specific time range for an asset
 */
export async function getEventsInTimeRange(
  assetId: string,
  startSeconds: number,
  endSeconds: number,
): Promise<AnalysisEvent[]> {
  const { data, error } = await supabase
    .from("ai_analysis_events")
    .select("*")
    .eq("asset_id", assetId)
    .gte("timestamp_seconds", startSeconds)
    .lte("timestamp_seconds", endSeconds)
    .order("timestamp_seconds", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get recent critical events (High severity)
 */
export async function getCriticalEvents(limit = 20): Promise<AnalysisEvent[]> {
  const { data, error } = await supabase
    .from("ai_analysis_events")
    .select("*")
    .eq("severity", "High")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
}

