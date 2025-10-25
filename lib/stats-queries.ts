/**
 * Statistics Query Helpers
 * Complex aggregations and analytics queries for the stats dashboard
 */

import { supabase } from "./supabase";
import { getJobStats, getPopularTags } from "./ai-analysis-queries";

export interface TimeRange {
  start: Date;
  end: Date;
  label: string;
}

export interface StatsData {
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
  cameraActivity: Array<{ camera_name: string; event_count: number; camera_id: string }>;
  
  // Time-series data
  jobsTimeline: Array<{ date: string; created: number; succeeded: number; failed: number }>;
  detectionsTimeline: Array<{ date: string; detections: number; frames: number }>;
  occupancyData: Array<{ timestamp: number; count: number }>;
  
  // Processing volume
  processingVolume: Array<{ date: string; volume: number }>;
}

/**
 * Get time range based on filter
 */
export function getTimeRange(filter: '24h' | '7d' | '30d' | 'all'): TimeRange | null {
  const end = new Date();
  let start: Date;
  let label: string;
  
  switch (filter) {
    case '24h':
      start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      label = 'Last 24 Hours';
      break;
    case '7d':
      start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = 'Last 7 Days';
      break;
    case '30d':
      start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      label = 'Last 30 Days';
      break;
    case 'all':
      return null; // No filter
    default:
      return null;
  }
  
  return { start, end, label };
}

/**
 * Get comprehensive statistics for the dashboard
 */
export async function getStats(timeFilter: '24h' | '7d' | '30d' | 'all' = 'all'): Promise<StatsData> {
  const timeRange = getTimeRange(timeFilter);
  
  // Fetch job stats
  const jobStats = await getJobStats();
  const successRate = jobStats.total > 0 
    ? (jobStats.succeeded / jobStats.total) * 100 
    : 0;
  
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
  };
}

/**
 * Get asset statistics
 */
async function getAssetStats(timeRange: TimeRange | null) {
  let query = supabase.from("assets").select("status");
  
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
  let jobsQuery = supabase
    .from("ai_analysis_jobs")
    .select("source_id, source_type")
    .eq("source_type", "live");
  
  if (timeRange) {
    jobsQuery = jobsQuery.gte("created_at", timeRange.start.toISOString());
  }
  
  const { data: jobs, error: jobsError } = await jobsQuery;
  
  if (jobsError) {
    console.error("Error fetching camera jobs:", jobsError);
    return [];
  }
  
  // Count jobs per camera
  const cameraJobCounts = new Map<string, number>();
  for (const job of jobs || []) {
    const cameraId = job.source_id;
    cameraJobCounts.set(cameraId, (cameraJobCounts.get(cameraId) || 0) + 1);
  }
  
  // Get camera names from live_streams
  const cameraIds = Array.from(cameraJobCounts.keys());
  if (cameraIds.length === 0) {
    return [];
  }
  
  const { data: streams, error: streamsError } = await supabase
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
    const cameraName = stream.camera_name || `Camera ${stream.id.substring(0, 8)}`;
    
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
  const grouped = new Map<string, { created: number; succeeded: number; failed: number }>();
  
  for (const job of data || []) {
    const date = new Date(job.created_at).toISOString().split('T')[0];
    
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
    const date = new Date(frame.created_at).toISOString().split('T')[0];
    
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
  let query = supabase
    .from("ai_object_detections")
    .select("frame_timestamp, detections, created_at")
    .order("frame_timestamp");
  
  if (timeRange) {
    query = query.gte("created_at", timeRange.start.toISOString());
  }
  
  const { data, error } = await query.limit(1000);
  
  if (error) {
    console.error("Error fetching occupancy data:", error);
    return [];
  }
  
  return (data || []).map((frame) => ({
    timestamp: frame.frame_timestamp,
    count: (frame.detections || []).filter((d: any) => d.class === "person").length,
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
    const date = new Date(job.created_at).toISOString().split('T')[0];
    grouped.set(date, (grouped.get(date) || 0) + 1);
  }
  
  return Array.from(grouped.entries())
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

