/**
 * Statistics Query Helpers
 * Complex aggregations and analytics queries for the stats dashboard
 */

import { getJobStats, getPopularTags } from "./ai-analysis-queries";
import { supabase } from "./supabase";

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

// Supabase-only stats (without Elasticsearch metrics)
export interface SupabaseStats {
  // Job statistics
  jobStats: {
    total: number;
    queued: number;
    processing: number;
    succeeded: number;
    failed: number;
    dead: number;
    successRate: number;
  };

  // Tag statistics
  topTags: Array<{ tag: string; count: number }>;

  // Asset/Stream counts
  assetStats: {
    total: number;
    ready: number;
    processing: number;
    errored: number;
  };

  streamStats: {
    total: number;
    active: number;
    idle: number;
    disabled: number;
  };

  // Detection statistics
  detectionStats: {
    totalDetections: number;
    totalFrames: number;
    averageDetectionsPerFrame: number;
    classCounts: Array<{ class: string; count: number }>;
  };

  // Camera activity
  cameraActivity: Array<{
    camera_name: string;
    event_count: number;
    camera_id: string;
  }>;

  // Time-series data
  jobsTimeline: Array<{
    date: string;
    created: number;
    succeeded: number;
    failed: number;
  }>;
  detectionsTimeline: Array<{
    date: string;
    detections: number;
    frames: number;
  }>;
  occupancyData: Array<{ timestamp: number; count: number }>;

  // Processing volume
  processingVolume: Array<{ date: string; volume: number }>;

  // Asset duration distribution
  assetDurations: Array<{ range: string; count: number }>;
}

// Combined stats (Supabase + Elasticsearch)
export interface StatsData extends SupabaseStats {
  // Elasticsearch metrics
  esMetrics: {
    eventSeverity: Array<{ severity: string; count: number }>;
    eventTypes: Array<{ type: string; count: number }>;
    eventTimeline: Array<{ date: string; count: number }>;
    topEntities: Array<{ entity: string; count: number; type?: string }>;
    entityTypes: Array<{ type: string; count: number }>;
    assetTypes: Array<{ type: "live" | "vod"; count: number }>;
    cameraEventPatterns: Array<{
      camera_name: string;
      camera_id: string;
      high: number;
      medium: number;
      minor: number;
      total: number;
    }>;
  };
}

/**
 * Get time range based on filter
 */
export function getTimeRange(
  filter: "24h" | "7d" | "30d" | "all",
): TimeRange | null {
  const end = new Date();
  let start: Date;
  let label: string;

  switch (filter) {
    case "24h":
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      label = "Last 24 Hours";
      break;
    case "7d":
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = "Last 7 Days";
      break;
    case "30d":
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = "Last 30 Days";
      break;
    case "all":
      return null; // No filter
    default:
      return null;
  }

  return { start, end, label };
}

/**
 * Get comprehensive statistics for the dashboard (Supabase only)
 * Note: Elasticsearch metrics are fetched separately by the API route
 */
export async function getStats(
  timeFilter: "24h" | "7d" | "30d" | "all" = "all",
): Promise<SupabaseStats> {
  const timeRange = getTimeRange(timeFilter);

  // Fetch job stats
  const jobStats = await getJobStats();
  const successRate =
    jobStats.total > 0 ? (jobStats.succeeded / jobStats.total) * 100 : 0;

  // Fetch top tags
  const topTags = await getPopularTags(10);

  // Fetch asset stats
  const assetStats = await getAssetStats(timeRange);

  // Fetch stream stats
  const streamStats = await getStreamStats();

  // Fetch detection stats
  const detectionStats = await getDetectionStats(timeRange);

  // Fetch camera activity
  const cameraActivity = await getCameraActivity(timeRange);

  // Fetch time-series data
  const jobsTimeline = await getJobsTimeline(timeRange);
  const detectionsTimeline = await getDetectionsTimeline(timeRange);
  const occupancyData = await getOccupancyData(timeRange);
  const processingVolume = await getProcessingVolume(timeRange);
  const assetDurations = await getAssetDurationDistribution(timeRange);

  return {
    jobStats: {
      ...jobStats,
      successRate,
    },
    topTags,
    assetStats,
    streamStats,
    detectionStats,
    cameraActivity,
    jobsTimeline,
    detectionsTimeline,
    occupancyData,
    processingVolume,
    assetDurations,
  };
}

/**
 * Get asset statistics
 */
async function getAssetStats(timeRange: TimeRange | null) {
  let query = supabase.schema("mux").from("assets").select("status");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching asset stats:", error);
    return { total: 0, ready: 0, processing: 0, errored: 0 };
  }

  const stats = {
    total: data?.length || 0,
    ready: 0,
    processing: 0,
    errored: 0,
  };

  for (const asset of data || []) {
    if (asset.status === "ready") stats.ready++;
    else if (asset.status === "preparing") stats.processing++;
    else if (asset.status === "errored") stats.errored++;
  }

  return stats;
}

/**
 * Get stream statistics
 */
async function getStreamStats() {
  const { data, error } = await supabase
    .schema("mux")
    .from("live_streams")
    .select("status");

  if (error) {
    console.error("Error fetching stream stats:", error);
    return { total: 0, active: 0, idle: 0, disabled: 0 };
  }

  const stats = {
    total: data?.length || 0,
    active: 0,
    idle: 0,
    disabled: 0,
  };

  for (const stream of data || []) {
    if (stream.status === "active") stats.active++;
    else if (stream.status === "idle") stats.idle++;
    else if (stream.status === "disabled") stats.disabled++;
  }

  return stats;
}

/**
 * Get camera activity distribution
 */
async function getCameraActivity(timeRange: TimeRange | null) {
  // Get jobs with their source (camera) information
  // Note: Both 'live' and 'vod' source_type can reference live_streams
  let jobsQuery = supabase
    .from("ai_analysis_jobs")
    .select("source_id, source_type");

  if (timeRange) {
    jobsQuery = jobsQuery.gte("created_at", timeRange.start.toISOString());
  }

  const { data: jobs, error: jobsError } = await jobsQuery;

  if (jobsError) {
    console.error("Error fetching camera jobs:", jobsError);
    return [];
  }

  // Get all live stream IDs to check which jobs reference cameras
  const { data: allStreams, error: allStreamsError } = await supabase
    .schema("mux")
    .from("live_streams")
    .select("id, camera_name");

  if (allStreamsError) {
    console.error("Error fetching all streams:", allStreamsError);
    return [];
  }

  const streamIds = new Set((allStreams || []).map((s) => s.id));

  // Count jobs per camera (only jobs that reference live_streams)
  const cameraJobCounts = new Map<string, number>();
  for (const job of jobs || []) {
    const sourceId = job.source_id;
    // Check if this job's source_id is a live stream
    if (streamIds.has(sourceId)) {
      cameraJobCounts.set(sourceId, (cameraJobCounts.get(sourceId) || 0) + 1);
    }
  }

  // Get camera names from live_streams
  const cameraIds = Array.from(cameraJobCounts.keys());
  if (cameraIds.length === 0) {
    return [];
  }

  const { data: streams, error: streamsError } = await supabase
    .schema("mux")
    .from("live_streams")
    .select("id, camera_name")
    .in("id", cameraIds);

  if (streamsError) {
    console.error("Error fetching streams:", streamsError);
    return [];
  }

  // Build camera activity data
  const cameraActivity = [];
  for (const stream of streams || []) {
    const eventCount = cameraJobCounts.get(stream.id) || 0;
    const cameraName =
      stream.camera_name || `Camera ${stream.id.substring(0, 8)}`;

    cameraActivity.push({
      camera_id: stream.id,
      camera_name: cameraName,
      event_count: eventCount,
    });
  }

  // Sort by event count descending
  cameraActivity.sort((a, b) => b.event_count - a.event_count);

  return cameraActivity;
}

/**
 * Get detection statistics
 */
async function getDetectionStats(timeRange: TimeRange | null) {
  let query = supabase
    .from("ai_object_detections")
    .select("detections, created_at");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching detection stats:", error);
    return {
      totalDetections: 0,
      totalFrames: 0,
      averageDetectionsPerFrame: 0,
      classCounts: [],
    };
  }

  const classCounts = new Map<string, number>();
  let totalDetections = 0;

  for (const frame of data || []) {
    const detections = frame.detections || [];
    totalDetections += detections.length;

    for (const detection of detections) {
      const className = detection.class || "unknown";
      classCounts.set(className, (classCounts.get(className) || 0) + 1);
    }
  }

  return {
    totalDetections,
    totalFrames: data?.length || 0,
    averageDetectionsPerFrame: data?.length ? totalDetections / data.length : 0,
    classCounts: Array.from(classCounts.entries())
      .map(([cls, count]) => ({ class: cls, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/**
 * Get jobs timeline (created/succeeded/failed over time)
 */
async function getJobsTimeline(timeRange: TimeRange | null) {
  let query = supabase
    .from("ai_analysis_jobs")
    .select("created_at, updated_at, status");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching jobs timeline:", error);
    return [];
  }

  // Group by date
  const grouped = new Map<
    string,
    { created: number; succeeded: number; failed: number }
  >();

  for (const job of data || []) {
    const date = new Date(job.created_at).toISOString().split("T")[0];

    if (!grouped.has(date)) {
      grouped.set(date, { created: 0, succeeded: 0, failed: 0 });
    }

    const stats = grouped.get(date)!;
    stats.created++;

    if (job.status === "succeeded") stats.succeeded++;
    if (job.status === "failed" || job.status === "dead") stats.failed++;
  }

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get detections timeline
 */
async function getDetectionsTimeline(timeRange: TimeRange | null) {
  let query = supabase
    .from("ai_object_detections")
    .select("created_at, detections");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching detections timeline:", error);
    return [];
  }

  // Group by date
  const grouped = new Map<string, { detections: number; frames: number }>();

  for (const frame of data || []) {
    const date = new Date(frame.created_at).toISOString().split("T")[0];

    if (!grouped.has(date)) {
      grouped.set(date, { detections: 0, frames: 0 });
    }

    const stats = grouped.get(date)!;
    stats.frames++;
    stats.detections += (frame.detections || []).length;
  }

  return Array.from(grouped.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get occupancy data (people count over time)
 */
async function getOccupancyData(timeRange: TimeRange | null) {
  // Get the most recent detections, ordered by created_at DESC, then take the latest 100
  let query = supabase
    .from("ai_object_detections")
    .select("created_at, detections")
    .order("created_at", { ascending: false })
    .limit(100);

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching occupancy data:", error);
    return [];
  }

  // Reverse to get chronological order for the chart
  const chronologicalData = (data || []).reverse();

  return chronologicalData.map((frame) => ({
    timestamp: new Date(frame.created_at).getTime() / 1000, // Convert to Unix timestamp in seconds
    count: (frame.detections || []).filter((d: any) => d.class === "person")
      .length,
  }));
}

/**
 * Get processing volume over time
 */
async function getProcessingVolume(timeRange: TimeRange | null) {
  let query = supabase
    .from("ai_analysis_jobs")
    .select("created_at, status")
    .eq("status", "succeeded");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching processing volume:", error);
    return [];
  }

  // Group by date and count
  const grouped = new Map<string, number>();

  for (const job of data || []) {
    const date = new Date(job.created_at).toISOString().split("T")[0];
    grouped.set(date, (grouped.get(date) || 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get asset duration distribution (clip/recording lengths)
 */
async function getAssetDurationDistribution(timeRange: TimeRange | null) {
  let query = supabase
    .schema("mux")
    .from("assets")
    .select("duration_seconds")
    .not("duration_seconds", "is", null)
    .eq("status", "ready");

  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching asset durations:", error);
    return [];
  }

  // Create duration bins: 0-30s, 30s-1m, 1-5m, 5-15m, 15-30m, 30m-1h, 1h+
  const bins = [
    { range: "0-30s", count: 0, min: 0, max: 30 },
    { range: "30s-1m", count: 0, min: 30, max: 60 },
    { range: "1-5m", count: 0, min: 60, max: 300 },
    { range: "5-15m", count: 0, min: 300, max: 900 },
    { range: "15-30m", count: 0, min: 900, max: 1800 },
    { range: "30m-1h", count: 0, min: 1800, max: 3600 },
    { range: "1h+", count: 0, min: 3600, max: Infinity },
  ];

  for (const asset of data || []) {
    const duration = asset.duration_seconds;
    if (typeof duration === "number" && duration >= 0) {
      for (const bin of bins) {
        if (duration >= bin.min && duration < bin.max) {
          bin.count++;
          break;
        }
      }
    }
  }

  // Return only bins with data and remove min/max properties
  return bins
    .filter((bin) => bin.count > 0)
    .map(({ range, count }) => ({ range, count }));
}
